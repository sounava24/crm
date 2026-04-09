import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const admin = await prisma.admin.findUnique({ where: { email } });
          if (!admin) return null;
          const passwordsMatch = await bcrypt.compare(password, admin.password);

          if (passwordsMatch) return { id: admin.id, email: admin.email };
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
