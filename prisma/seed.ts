import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

const pool = new Client({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

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
  const admin = await prisma.admin.upsert({
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
  console.log("Password: password123");
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
