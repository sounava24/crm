import React from "react";
import { auth } from "@/auth";
import { PortalShell } from "@/components/portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return <PortalShell userEmail={session?.user?.email}>{children}</PortalShell>;
}
