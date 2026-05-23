import { signOut } from "@/auth";
import Link from "next/link";
import { LogOut, X } from "lucide-react";

export default function LogoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-locked-bg">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-red-500/20 mb-4">
            <LogOut size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sign Out</h1>
          <p className="text-locked-muted mt-2">Are you sure you want to sign out?</p>
        </div>

        <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
          
          <div className="space-y-4 relative z-10">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={20} /> Yes, sign me out
              </button>
            </form>
            <Link
              href="/dashboard"
              className="w-full py-3 bg-locked-card hover:bg-slate-300 dark:hover:bg-slate-700 text-locked-text dark:text-slate-100 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <X size={20} /> Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
