"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  PlusCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);
  const isSidebarCollapsed = !isSidebarHovered;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="sticky top-0 z-50 h-16 glass-nav flex items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={isMobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
            onClick={() => setIsMobileSidebarOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-locked-muted transition-all hover:bg-locked-panel-solid/70 hover:text-brand-gradient-end md:hidden"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
              <BrandLogo size={40} />
            </div>
            <span className="hidden text-xl font-bold tracking-tight sm:block">WELCOME TO DM STACK LABS</span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-locked-muted">
          <span className="hidden sm:inline">Dashboard</span>
          <span className="hidden sm:inline">/</span>
          <span className="truncate text-locked-text font-medium capitalize">
            {breadcrumb}
          </span>
        </div>
        
        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-gradient-end" />
          <span className="hidden font-medium text-sm sm:block">Super Admin</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {isMobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/40 md:hidden"
          />
        )}

        <Sidebar
          collapsed={isSidebarCollapsed}
          mobileOpen={isMobileSidebarOpen}
          pathname={pathname}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          onNavigate={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto bg-locked-bg">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  mobileOpen,
  pathname,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  pathname: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate: () => void;
}) {
  const sidebarWidth = collapsed ? "md:w-20" : "md:w-64";

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${sidebarWidth} glass-card fixed bottom-0 top-16 z-40 flex w-64 -translate-x-full flex-col border-r border-locked-border transition-[transform,width] duration-300 ease-in-out md:static md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : ""
      }`}
    >
      <div className={`${collapsed ? "p-6 md:p-4" : "p-6"} flex min-h-0 flex-1 flex-col transition-all duration-300`}>
        <nav className="space-y-2 pt-2">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            href="/dashboard"
            collapsed={collapsed}
            active={pathname === "/dashboard"}
            onNavigate={onNavigate}
          />
          <SidebarItem
            icon={<CreditCard size={20} />}
            label="Payments"
            href="/dashboard/payments"
            collapsed={collapsed}
            active={pathname.startsWith("/dashboard/payments")}
            onNavigate={onNavigate}
          />
          <SidebarItem
            icon={<Settings size={20} />}
            label="Settings"
            href="/dashboard/settings"
            collapsed={collapsed}
            active={pathname.startsWith("/dashboard/settings")}
            onNavigate={onNavigate}
          />
          <div className="mt-8 border-t border-locked-border pt-4">
            <SidebarItem
              icon={<LogOut size={20} className="text-red-500" />}
              label="Logout"
              href="/logout"
              collapsed={collapsed}
              active={pathname.startsWith("/logout")}
              onNavigate={onNavigate}
            />
          </div>
        </nav>

        <div className="mt-auto pt-6">
          <Link 
            href="/dashboard/clients/add"
            title="Add Client"
            onClick={onNavigate}
            className={`flex items-center gap-2 w-full py-3 bg-gradient-to-r from-brand-blue to-brand-gradient-end hover:from-brand-gradient-end hover:to-brand-blue text-white rounded-xl transition-all shadow-md ${
              collapsed ? "md:justify-center md:px-0 px-4" : "px-4"
            }`}
          >
            <PlusCircle size={20} className="shrink-0" />
            <span className={`font-semibold overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
            }`}>
              Add Client
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  href,
  collapsed,
  active,
  onNavigate,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  collapsed: boolean;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      title={label}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-locked-muted transition-all group hover:bg-locked-panel-solid/70 hover:text-brand-gradient-end ${
        collapsed ? "md:justify-center md:px-0" : ""
      } ${
        active
          ? "bg-brand-blue/10 text-brand-gradient-end ring-1 ring-brand-blue/30"
          : ""
      }`}
    >
      <span className="shrink-0 group-hover:scale-110 transition-transform">{icon}</span>
      <span className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${
        collapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
      }`}>
        {label}
      </span>
    </Link>
  );
}

function getBreadcrumb(pathname: string) {
  if (pathname.startsWith("/dashboard/payments")) return "Payments";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/dashboard/clients/add")) return "Add Client";
  if (pathname.startsWith("/dashboard/clients/")) return "Client Details";
  return "Overview";
}
