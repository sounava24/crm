"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { initiatePhonePePayment, submitManualPayment } from "@/lib/actions";

export function PaymentForm({ clientId }: { clientId: string }) {
  const [method, setMethod] = useState<"phonepe" | "manual">("phonepe");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState<number | "">("");

  const handlePhonePe = async () => {
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    await initiatePhonePePayment(clientId, Number(amount));
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || !amount || amount <= 0) return;
    setIsSubmitting(true);
    await submitManualPayment(clientId, Number(amount), utr);
  };

  // Note: Replace 'your.business@bank' with your actual business UPI ID
  const upiString = `upi://pay?pa=soc6568@slc&pn=Nexus%20CRM&am=${amount || 0}&cu=INR`;

  return (
    <div>
      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Amount ($)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-slate-400 font-medium text-lg">$</span>
          </div>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full pl-10 pr-4 py-4 text-3xl font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6">
        <button
          onClick={() => setMethod("phonepe")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            method === "phonepe" ? "bg-white dark:bg-slate-800 shadow shadow-slate-200/50 dark:shadow-slate-900/50 text-indigo-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          PhonePe Gateway
        </button>
        <button
          onClick={() => setMethod("manual")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            method === "manual" ? "bg-white dark:bg-slate-800 shadow shadow-slate-200/50 dark:shadow-slate-900/50 text-indigo-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Dynamic QR
        </button>
      </div>

      {method === "phonepe" ? (
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-6 px-4">
            Pay instantly with zero processing fees via PhonePe Gateway. Includes seamless checkout and instant account activation.
          </p>
          <button
            onClick={handlePhonePe}
            disabled={isSubmitting || !amount || amount <= 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Proceed with PhonePe"}
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
            <QRCodeSVG value={upiString} size={200} level="H" />
          </div>
          <p className="text-xs text-slate-500 text-center mb-6">
            Scan this QR code with any UPI app (GPay, PhonePe, Paytm). The amount and details will be pre-filled. Enter your UTR below once complete.
          </p>
          <form onSubmit={handleManual} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">UTR Transaction ID</label>
              <input
                type="text"
                required
                placeholder="e.g. 300056123456"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || utr.length < 5 || !amount || amount <= 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow shadow-emerald-500/20 disabled:opacity-50 text-sm"
            >
              {isSubmitting ? "Submitting..." : "Submit for Priority Verification"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
