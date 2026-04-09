"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const ClientSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url(),
  dbUrl: z.string().min(5),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export async function createClient(formData: FormData) {
  const validatedFields = ClientSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl"),
    dbUrl: formData.get("dbUrl"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    return;
  }

  const { name, websiteUrl, dbUrl, adminEmail, adminPassword } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const apiKey = `nano_${crypto.randomUUID().replace(/-/g, '')}`;

  try {
    await prisma.client.create({
      data: {
        name,
        websiteUrl,
        dbUrl,
        status: "active",
        apiKey,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        admins: {
          create: {
            email: adminEmail,
            password: hashedPassword,
          },
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function recordPayment(clientId: string, amount: number) {
  try {
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          clientId,
          amount,
          status: "paid",
          paidAt: new Date(),
        },
      }),
      prisma.client.update({
        where: { id: clientId },
        data: {
          status: "active",
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend 30 days
        },
      }),
    ]);
  } catch (error) {
    console.error("Payment Error:", error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
}

export async function regenerateApiKey(clientId: string) {
  const newApiKey = `nano_${crypto.randomUUID().replace(/-/g, '')}`;
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { apiKey: newApiKey },
    });
  } catch (error) {
    console.error("API Key Regeneration Error:", error);
    return;
  }
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function toggleClientStatus(clientId: string, currentStatus: string) {
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { status: currentStatus === "active" ? "suspended" : "active" },
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    return;
  }
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/clients/${clientId}`);
}
