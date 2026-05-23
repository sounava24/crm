"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-2 rounded-lg bg-locked-panel-solid hover:bg-locked-card text-locked-muted transition-all flex items-center justify-center"
      title="Copy API Key"
      type="button"
    >
      {copied ? <Check size={16} className="text-brand-accent" /> : <Copy size={16} />}
    </button>
  );
}
