"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";
import { encodePayload, generateChecksum, PHONEPE_HOST, PHONEPE_MERCHANT_ID } from "./phonepe";
import { signOut } from "@/auth";

const ClientSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url(),
  dbUrl: z.string().min(5),
  phoneNumber: z.string().optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export async function createClient(formData: FormData) {
  const validatedFields = ClientSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl"),
    dbUrl: formData.get("dbUrl"),
    phoneNumber: formData.get("phoneNumber"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    return;
  }

  const { name, websiteUrl, dbUrl, phoneNumber, adminEmail, adminPassword } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const apiKey = `nano_${crypto.randomUUID().replace(/-/g, '')}`;

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

export async function submitManualPayment(clientId: string, amount: number, utrNumber: string) {
  try {
    await prisma.payment.create({
      data: {
        clientId,
        amount,
        status: "pending",
        method: "manual",
        transactionId: utrNumber,
      },
    });
  } catch (error) {
    console.error("Submit Manual Payment Error:", error);
    return;
  }
  revalidatePath(`/pay/${clientId}`);
  revalidatePath("/dashboard/payments");
}

export async function approvePayment(paymentId: string) {
  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        paidAt: new Date(),
      },
    });

    await prisma.client.update({
      where: { id: payment.clientId },
      data: {
        status: "active",
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend 30 days
      },
    });
  } catch (error) {
    console.error("Approve Payment Error:", error);
    return;
  }
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
}

export async function initiatePhonePePayment(clientId: string, amount: number) {
  const transactionId = `T${Date.now()}`;
  let checkoutUrl = "";

  try {
    // 1. Log payment as pending. It will be verified by the webhook callback.
    await prisma.payment.create({
      data: {
        clientId,
        amount,
        status: "pending",
        method: "phonepe",
        transactionId: transactionId,
      },
    });

    // 2. Build the domain dynamically for the callback
    const reqHeaders = await headers();
    const host = reqHeaders.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // 3. Assemble PhonePe Payload
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: clientId,
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: `${baseUrl}/pay/${clientId}`,
      redirectMode: "GET",
      callbackUrl: `${baseUrl}/api/phonepe/callback`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = encodePayload(payload);
    const checksum = generateChecksum(base64Payload, "/pg/v1/pay");

    // 4. Send request to PhonePe Server
    const response = await fetch(`${PHONEPE_HOST}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();
    
    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      checkoutUrl = data.data.instrumentResponse.redirectInfo.url;
    } else {
      console.error("PhonePe API Error Payload:", data);
      throw new Error(`PhonePe Gateway Error: ${data.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("PhonePe Gateway Request Error:", error);
    throw error;
  }

  // Next.js redirect must be called outside try-catch to properly interrupt execution
  if (checkoutUrl) {
    redirect(checkoutUrl);
  }
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
      data: { status: "suspended" },
    });

    revalidatePath("/dashboard");
    return { suspended: overdue.length, clientNames: overdue.map((c) => c.name) };
  } catch (error) {
    console.error("Auto Suspend Error:", error);
    return { suspended: 0, clientNames: [] };
  }
}

