"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-gradient-end px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-gradient-end hover:to-brand-blue print:hidden"
    >
      <Printer size={16} />
      Download Invoice
    </button>
  );
}
