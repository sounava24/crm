"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-locked-bg">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto flex items-center justify-center mb-4">
            <BrandLogo size={80} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">WELCOME TO DM STACK LABS</h1>
          <p className="text-locked-muted mt-2">Central Management for Client Tenants</p>
        </div>

        <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-brand-gradient-end" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-locked-muted/80" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@crm.com"
                  className="w-full pl-10 pr-4 py-2 bg-locked-panel-solid/70 border border-locked-border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Password</label>
                <a href="#" className="text-xs text-brand-blue hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-locked-muted/80" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-locked-panel-solid/70 border border-locked-border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-gradient-end hover:from-brand-gradient-end hover:to-brand-blue disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-brand-blue/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In to Console"}
            </button>
          </form>
        </div>
        
        <p className="text-center text-sm text-locked-muted mt-8">
          Not an admin? <a href="#" className="text-brand-blue font-medium hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}
