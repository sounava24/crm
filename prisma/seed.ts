import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { getStrongPasswordError, validateStrongPassword } from "../src/lib/password-policy";

const connectionString = process.env.DATABASE_URL;

const pool = new Client({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedPassword =
    process.env.SEED_ADMIN_PASSWORD ||
    (process.env.NODE_ENV === "production" ? "" : "Password123!");
  const passwordValidation = validateStrongPassword(seedPassword);

  if (!seedPassword || !passwordValidation.valid) {
    throw new Error(
      process.env.NODE_ENV === "production"
        ? "SEED_ADMIN_PASSWORD is required in production and must meet the strong password policy."
        : `Seed password is weak. ${getStrongPasswordError(seedPassword)}`
    );
  }

  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  // 1. Create a "System" client for management
  const systemClient = await prisma.client.upsert({
    where: { id: "system-client" },
    update: {},
    create: {
      id: "system-client",
      name: "CRM System",
      websiteUrl: "https://crm.nano",
      dbUrl: "system",
      status: "active",
      nextPaymentDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Far future
    },
  });

  // 2. Create the Super Admin
  await prisma.admin.upsert({
    where: { email: "admin@crm.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "admin@crm.com",
      password: hashedPassword,
      clientId: systemClient.id,
    },
  });

  console.log("Database seeded successfully!");
  console.log("----------------------------");
  console.log("Email: admin@crm.com");
  console.log("Password: configured via SEED_ADMIN_PASSWORD or local development default");
  console.log("----------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
