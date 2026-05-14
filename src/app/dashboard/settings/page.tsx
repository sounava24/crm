import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminPasswordForm from "@/components/admin-password-form";
import { Key, Shield, User } from "lucide-react";

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
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your CRM core configurations and admin preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm transition-all shadow-md">
            <User size={18} /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900 transition-all font-medium text-sm">
            <Shield size={18} /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900 transition-all font-medium text-sm">
            <Key size={18} /> API Webhooks
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-6">
          {/* Read-only profile info */}
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User size={20} className="text-indigo-500" />
              Admin Profile
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={admin.email}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">
                  The primary super admin email cannot be changed from the dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <AdminPasswordForm adminId={admin.id} />
        </div>
      </div>
    </div>
  );
}
