"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, Send, Save } from "lucide-react";

type Result = {
  success: boolean;
  message: string;
};

export function ClientPasswordOtpForm({ email }: { email: string }) {
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/client/profile/password/send-code", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.debug
            ? `${data.error || "Unable to send verification code."}: ${data.debug}`
            : data?.error || "Unable to send verification code."
        );
      }

      setCodeSent(true);
      setCooldown(30);
      setResult({
        success: true,
        message: "Verification code sent to your registered email.",
      });
      window.setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unable to send verification code.",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUpdating(true);
    setResult(null);

    try {
      const response = await fetch("/api/client/profile/password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newPassword, confirmPassword }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update password.");
      }

      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCodeSent(false);
      setResult({ success: true, message: "Password updated successfully." });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unable to update password.",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const canSubmit =
    code.trim().length === 6 &&
    newPassword.length >= 8 &&
    confirmPassword.length >= 8 &&
    !isUpdating;

  return (
    <div className="glass-card rounded-3xl p-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Lock size={20} className="text-brand-blue" />
        Change Password
      </h2>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-locked-muted uppercase">
            Registered Email
          </label>
          <div className="flex items-center gap-3 w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 text-locked-muted">
            <Mail size={16} className="shrink-0 text-brand-blue" />
            <span className="truncate">{email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={sendCode}
          disabled={isSending || cooldown > 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-gradient-end px-5 py-3 font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-gradient-end hover:to-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={18} />
          {isSending
            ? "Sending code..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : codeSent
                ? "Resend Verification Code"
                : "Send Verification Code"}
        </button>

        <form onSubmit={updatePassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-locked-muted uppercase">
              Verification Code
            </label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-locked-muted/80" />
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                disabled={!codeSent}
                className="w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggle={() => setShowNew((value) => !value)}
            placeholder="At least 8 characters"
            disabled={!codeSent}
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirm}
            onToggle={() => setShowConfirm((value) => !value)}
            placeholder="Repeat new password"
            disabled={!codeSent}
          />

          {result && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium animate-fade-in ${
                result.success
                  ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                  : "bg-red-950/30 border-red-800 text-red-300"
              }`}
            >
              {result.success ? (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
              )}
              {result.message}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-gradient-end hover:from-brand-gradient-end hover:to-brand-blue text-white font-bold rounded-xl transition-all shadow-md shadow-brand-blue/20 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isUpdating ? "Updating password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-locked-muted uppercase">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-locked-panel-solid border border-locked-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-locked-muted/80 hover:text-locked-muted transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
