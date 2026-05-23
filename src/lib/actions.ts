"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signOut } from "@/auth";

const ClientSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url(),
  phoneNumber: z.string().optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export async function createClient(formData: FormData) {
  const validatedFields = ClientSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl"),
    phoneNumber: formData.get("phoneNumber"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    return;
  }

  const { name, websiteUrl, phoneNumber, adminEmail, adminPassword } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const apiKey = `nano_${crypto.randomUUID().replace(/-/g, '')}`;
  const dbUrl = `managed://${new URL(websiteUrl).hostname}`;

  try {
    await prisma.client.create({
      data: {
        name,
        websiteUrl,
        dbUrl,
        phoneNumber,
        status: "active",
        apiKey,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        billingAmount: 0,
        billingCurrency: "INR",
        billingCycle: "MONTHLY",
        billingStatus: "PENDING",
        nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
          currency: "INR",
          status: "PAID",
          provider: "CASHFREE",
          paidAt: new Date(),
        },
      }),
      prisma.client.update({
        where: { id: clientId },
        data: {
          status: "active",
          billingStatus: "PAID",
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend 30 days
          nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
  const nextStatus = currentStatus === "active" ? "suspended" : "active";
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        status: nextStatus,
        billingStatus: nextStatus === "suspended" ? "SUSPENDED" : undefined,
      },
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    return;
  }
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function updateClientPhone(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const phoneNumber = formData.get("phoneNumber") as string;

  if (!clientId) return;

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { phoneNumber },
    });
  } catch (error) {
    console.error("Update Phone Error:", error);
    return;
  }
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  try {
    await prisma.$transaction([
      prisma.admin.deleteMany({ where: { clientId } }),
      prisma.payment.deleteMany({ where: { clientId } }),
      prisma.client.delete({ where: { id: clientId } }),
    ]);
  } catch (error) {
    console.error("Delete Client Error:", error);
    return;
  }
  revalidatePath("/dashboard");
}

export async function adminSignOut() {
  await signOut({ redirectTo: "/login" });
}

export async function updateAdminPassword(
  adminId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required." };
  }
  if (newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match." };
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return { success: false, error: "Admin not found." };

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return { success: false, error: "Current password is incorrect." };

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashed },
    });

    return { success: true };
  } catch (error) {
    console.error("Update Password Error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function autoSuspendOverdueClients(): Promise<{
  suspended: number;
  clientNames: string[];
}> {
  try {
    const overdue = await prisma.client.findMany({
      where: {
        status: "active",
        nextPaymentDate: { lt: new Date() },
        id: { not: "system-client" },
      },
      select: { id: true, name: true },
    });

    if (overdue.length === 0) return { suspended: 0, clientNames: [] };

    await prisma.client.updateMany({
      where: {
        id: { in: overdue.map((c) => c.id) },
      },
      data: { status: "suspended", billingStatus: "OVERDUE" },
    });

    revalidatePath("/dashboard");
    return { suspended: overdue.length, clientNames: overdue.map((c) => c.name) };
  } catch (error) {
    console.error("Auto Suspend Error:", error);
    return { suspended: 0, clientNames: [] };
  }
}
