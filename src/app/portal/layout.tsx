import React from "react";
import Link from "next/link";
import { LayoutDashboard, Receipt, LogOut, Shield, UserCircle } from "lucide-react";
import { auth } from "@/auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
              <Shield size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Client Portal</span>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" href="/portal" />
            <SidebarItem icon={<Receipt size={20} />} label="Receipts" href="/portal/receipts" />
            <SidebarItem icon={<UserCircle size={20} />} label="My Profile" href="/portal/profile" />
            
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-4">
              <SidebarItem icon={<LogOut size={20} className="text-red-500" />} label="Logout" href="/logout" />
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        <header className="sticky top-0 z-10 h-16 glass-nav flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Client Dashboard</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">{session?.user?.email}</div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500" />
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
