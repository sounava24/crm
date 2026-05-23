import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientPasswordOtpForm } from "@/components/client-password-otp-form";
import { User, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage() {
  const session = await auth();
  if (!session?.user?.clientId) redirect("/login");

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email! },
    select: { id: true, email: true, clientId: true },
  });

  if (!admin) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { id: admin.clientId },
    select: { name: true, websiteUrl: true, status: true },
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-locked-muted mt-1">
          Manage your account credentials and details.
        </p>
      </div>

      {/* Account Info */}
      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <User size={20} className="text-brand-blue" />
          Account Details
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-locked-muted uppercase">Email Address</label>
            <input
              type="email"
              disabled
              value={admin.email}
              className="w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 text-locked-muted cursor-not-allowed"
            />
            <p className="text-xs text-locked-muted/80">
              Contact your service provider to change your email.
            </p>
          </div>

          {client && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-locked-muted uppercase">Organisation</label>
              <div className="flex items-center gap-3 w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 text-locked-muted">
                <Globe size={16} className="shrink-0 text-brand-blue" />
                <span className="font-medium text-locked-text">{client.name}</span>
                <span className="text-xs ml-auto text-locked-muted/80 truncate">{client.websiteUrl}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <ClientPasswordOtpForm email={admin.email} />
    </div>
  );
}
