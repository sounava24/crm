import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.clientId = (user as any).clientId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.clientId) {
        (session.user as any).clientId = token.clientId;
        (session.user as any).id = token.id;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as any;
      const isLoggedIn = !!user;
      const isSuperAdmin = isLoggedIn && (user?.clientId === "system-client" || user?.email === "admin@crm.com");
      const isClient = isLoggedIn && !!user?.clientId && user?.clientId !== "system-client";

      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnPay = nextUrl.pathname.startsWith("/pay");
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

      if (isLoggedIn && !isOnPay && !isOnLogout) {
        if (isSuperAdmin) return Response.redirect(new URL("/dashboard", nextUrl));
        if (isClient) return Response.redirect(new URL("/portal", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
