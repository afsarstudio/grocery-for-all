"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function OrderPrintButton({ orderNumber }: { orderNumber: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
    >
      <Printer className="w-4 h-4 text-slate-500" />
      <span>Print Receipt</span>
    </button>
  );
}
