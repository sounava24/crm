"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, LogOut, UserCircle, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function PortalShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const collapsed = !isSidebarHovered;

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
          <Link href="/portal" className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
              <BrandLogo size={40} />
            </div>
            <span className="hidden text-xl font-bold tracking-tight sm:block">WELCOME TO DM STACK LABS</span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-locked-muted">
          <span className="hidden sm:inline">Client Dashboard</span>
          <span className="hidden sm:inline">/</span>
          <span className="truncate text-locked-text font-medium">{getCurrentPage(pathname)}</span>
        </div>
        
        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <div className="hidden text-sm text-locked-muted sm:block">{userEmail}</div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-gradient-end" />
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

        <aside
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className={`${collapsed ? "md:w-20" : "md:w-64"} glass-card fixed bottom-0 top-16 z-40 flex w-64 -translate-x-full flex-col border-r border-locked-border transition-[transform,width] duration-500 ease-in-out md:static md:translate-x-0 ${
            isMobileSidebarOpen ? "translate-x-0" : ""
          }`}
        >
          <div className={`${collapsed ? "p-6 md:p-4" : "p-6"} flex min-h-0 flex-1 flex-col transition-all duration-500 ease-in-out`}>
            <nav className="space-y-2 pt-2">
              <SidebarItem
                icon={<LayoutDashboard size={20} />}
                label="Overview"
                href="/portal"
                collapsed={collapsed}
                active={pathname === "/portal"}
                onNavigate={() => setIsMobileSidebarOpen(false)}
              />
              <SidebarItem
                icon={<Receipt size={20} />}
                label="Payments"
                href="/portal/receipts"
                collapsed={collapsed}
                active={pathname.startsWith("/portal/receipts")}
                onNavigate={() => setIsMobileSidebarOpen(false)}
              />
              <SidebarItem
                icon={<UserCircle size={20} />}
                label="My Profile"
                href="/portal/profile"
                collapsed={collapsed}
                active={pathname.startsWith("/portal/profile")}
                onNavigate={() => setIsMobileSidebarOpen(false)}
              />
              
              <div className="mt-8 border-t border-locked-border pt-4">
                <SidebarItem
                  icon={<LogOut size={20} className="text-red-500" />}
                  label="Logout"
                  href="/logout"
                  collapsed={collapsed}
                  active={pathname.startsWith("/logout")}
                  onNavigate={() => setIsMobileSidebarOpen(false)}
                />
              </div>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-locked-bg">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
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
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-locked-muted transition-all duration-500 ease-in-out group hover:bg-locked-panel-solid/70 hover:text-brand-gradient-end ${
        collapsed ? "md:justify-center md:px-0" : ""
      } ${
        active
          ? "bg-brand-blue/10 text-brand-gradient-end ring-1 ring-brand-blue/30"
          : ""
      }`}
    >
      <span className="shrink-0 transition-transform duration-500 ease-in-out group-hover:scale-110">{icon}</span>
      <span className={`font-medium overflow-hidden whitespace-nowrap transition-[width,opacity,transform] duration-500 ease-in-out ${
        collapsed ? "md:w-0 md:opacity-0 md:-translate-x-2" : "w-auto opacity-100 translate-x-0"
      }`}>
        {label}
      </span>
    </Link>
  );
}

function getCurrentPage(pathname: string) {
  if (pathname.startsWith("/portal/receipts")) return "Payments";
  if (pathname.startsWith("/portal/profile")) return "My Profile";
  return "Overview";
}
