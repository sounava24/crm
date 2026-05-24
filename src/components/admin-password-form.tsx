"use client";

import { useState, useTransition, useRef } from "react";
import { updateAdminPassword } from "@/lib/actions";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { PASSWORD_REQUIREMENTS, STRONG_PASSWORD_PATTERN, validateStrongPassword } from "@/lib/password-policy";

interface AdminPasswordFormProps {
  adminId: string;
  accentColor?: "brand" | "emerald";
}

export default function AdminPasswordForm({
  adminId,
  accentColor = "brand",
}: AdminPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const accent =
    accentColor === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-brand-accent shadow-brand-accent/20"
      : "bg-gradient-to-r from-brand-blue to-brand-gradient-end hover:from-brand-gradient-end hover:to-brand-blue focus:ring-brand-blue shadow-brand-blue/20";

  const focusRing =
    accentColor === "emerald"
      ? "focus:ring-brand-accent"
      : "focus:ring-brand-blue";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);

    startTransition(async () => {
      const res = await updateAdminPassword(adminId, formData);
      setResult(res);
      if (res.success) {
        formRef.current?.reset();
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  const passwordErrors = newPassword ? validateStrongPassword(newPassword).errors : [];
  const canSubmit =
    validateStrongPassword(newPassword).valid &&
    newPassword === confirmPassword &&
    !isPending;

  return (
    <div className="glass-card rounded-3xl p-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Lock
          size={20}
          className={accentColor === "emerald" ? "text-brand-accent" : "text-brand-blue"}
        />
        Change Password
      </h2>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-locked-muted uppercase">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              name="currentPassword"
              required
              placeholder="••••••••"
              className={`w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 ${focusRing} transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-locked-muted/80 hover:text-locked-muted transition-colors"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-locked-muted uppercase">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              name="newPassword"
              required
              minLength={8}
              pattern={STRONG_PASSWORD_PATTERN}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              className={`w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 ${focusRing} transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-locked-muted/80 hover:text-locked-muted transition-colors"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-locked-border bg-locked-panel-solid/50 p-4 text-sm text-locked-muted">
          <p className="mb-2 font-semibold text-locked-text">Password requirements</p>
          <ul className="space-y-1">
            {PASSWORD_REQUIREMENTS.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
          {passwordErrors.length > 0 && (
            <p className="mt-3 text-red-300">{passwordErrors[0]}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-locked-muted uppercase">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              required
              minLength={8}
              pattern={STRONG_PASSWORD_PATTERN}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat new password"
              className={`w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 ${focusRing} transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-locked-muted/80 hover:text-locked-muted transition-colors"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-sm font-medium text-red-300">New passwords do not match.</p>
        )}

        {/* Feedback */}
        {result && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium animate-fade-in ${
              result.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            {result.success ? (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
            )}
            {result.success ? "Password updated successfully!" : result.error}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-6 py-3 ${accent} text-white font-bold rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <Save size={18} />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
