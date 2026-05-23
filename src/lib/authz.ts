import { auth } from "@/auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export function isSuperAdmin(user: { email?: string | null; clientId?: string | null } | null) {
  return !!user && (user.clientId === "system-client" || user.email === "admin@crm.com");
}

export async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!isSuperAdmin(user)) {
    return null;
  }
  return user;
}

export async function requireClientUser() {
  const user = await getSessionUser();
  if (!user?.clientId || user.clientId === "system-client") {
    return null;
  }
  return user;
}
