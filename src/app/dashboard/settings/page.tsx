import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch the admin record so we can pass the id to the form
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email! },
    select: { id: true, email: true },
  });

  if (!admin) redirect("/login");

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-locked-muted mt-1">
          Manage your CRM core configurations and admin preferences.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <User size={20} className="text-brand-blue" />
          Admin Profile
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-locked-muted uppercase">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={admin.email}
              className="w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 text-locked-muted cursor-not-allowed"
            />
            <p className="text-xs text-locked-muted/80">
              The primary super admin email cannot be changed from the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
