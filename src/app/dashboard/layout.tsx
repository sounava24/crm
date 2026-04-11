import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, CreditCard, Settings, PlusCircle, LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">CRM Nano</span>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" href="/dashboard" />
            <SidebarItem icon={<Users size={20} />} label="Clients" href="/dashboard" />
            <SidebarItem icon={<CreditCard size={20} />} label="Payments" href="/dashboard/payments" />
            <SidebarItem icon={<Settings size={20} />} label="Settings" href="/dashboard/settings" />
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-4">
              <SidebarItem icon={<LogOut size={20} className="text-red-500" />} label="Logout" href="/logout" />
            </div>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800">
           <Link 
            href="/dashboard/clients/add"
            className="flex items-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md"
          >
            <PlusCircle size={20} />
            <span className="font-semibold">Add Client</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        <header className="sticky top-0 z-10 h-16 glass-nav flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium capitalize">Overview</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            <span className="font-medium text-sm">Super Admin</span>
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
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
