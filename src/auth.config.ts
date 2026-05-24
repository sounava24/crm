import type { NextAuthConfig } from "next-auth";

type AppSessionUser = {
  id?: string | null;
  email?: string | null;
  clientId?: string | null;
  role?: "SUPER_ADMIN" | "CLIENT";
};

function getUserRole(user: { email?: string | null; clientId?: string | null }) {
  return user.clientId === "system-client" || user.email === "admin@crm.com"
    ? "SUPER_ADMIN"
    : "CLIENT";
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 15 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as AppSessionUser;
        token.clientId = appUser.clientId;
        token.id = user.id;
        token.role = getUserRole(appUser);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.clientId) {
        const user = session.user as AppSessionUser;
        user.clientId = String(token.clientId);
        user.id = token.id ? String(token.id) : undefined;
        user.role = token.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "CLIENT";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as AppSessionUser | undefined;
      const isLoggedIn = !!user;
      const isSuperAdmin = isLoggedIn && (user?.clientId === "system-client" || user?.email === "admin@crm.com");
      const isClient = isLoggedIn && !!user?.clientId && user?.clientId !== "system-client";

      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnPay = nextUrl.pathname.startsWith("/pay");
      const isOnPaymentSuccess = nextUrl.pathname.startsWith("/payment-success");
      const isOnLogout = nextUrl.pathname.startsWith("/logout");
      const isOnPortal = nextUrl.pathname.startsWith("/portal");

      if (isOnDashboard) {
        if (!isLoggedIn) return false;
        if (isClient) return Response.redirect(new URL("/portal", nextUrl));
        return true;
      }

      if (isOnPortal) {
        if (!isLoggedIn) return false;
        if (isSuperAdmin) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (isLoggedIn && !isOnPay && !isOnPaymentSuccess && !isOnLogout) {
        if (isSuperAdmin) return Response.redirect(new URL("/dashboard", nextUrl));
        if (isClient) return Response.redirect(new URL("/portal", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
