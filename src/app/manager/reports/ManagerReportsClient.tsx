"use client";

import React, { useState } from "react";
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Store,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Order } from "@/types";

export default function ManagerReportsClient({
  orders,
}: {
  orders: Order[];
}) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  // Calculations
  const validOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscount = validOrders.reduce((sum, o) => sum + o.discount, 0);

  const cashOrders = validOrders.filter((o) => o.paymentMethod === "CASH" || o.paymentMethod === "COD");
  const upiOrders = validOrders.filter((o) => o.paymentMethod === "UPI" || o.paymentMethod === "ONLINE");

  const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
  const upiTotal = upiOrders.reduce((sum, o) => sum + o.total, 0);

  const totalItemsSold = validOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const avgOrderValue = validOrders.length > 0 ? (totalRevenue / validOrders.length).toFixed(0) : "0";
  const estGst = (totalRevenue * 0.05).toFixed(0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Screen Header (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Shift Day-End Closing</span>
            </span>
            <span className="text-xs text-slate-400">
              Daily Settlement Form
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Daily Sales &amp; Cashier Closing Report
          </h1>
          <p className="text-xs text-slate-400">
            Official store day-end closing statement for Grocery for All (Tetari Bazar, Naugarh)
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-900/40 flex items-center gap-2 transition-all cursor-pointer w-fit"
        >
          <Printer className="w-4 h-4" />
          <span>Print Closing Statement</span>
        </button>
      </div>

      {/* Printable Report Sheet */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 max-w-4xl mx-auto space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="text-xs font-black text-brand-600 uppercase tracking-widest">
              SUPERMARKET DAY-END REGISTER
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              GROCERY FOR ALL
            </h2>
            <p className="text-xs text-slate-600">
              Rahul Nagar, Khajuriya, Tetari Bazar, Naugarh 272207 (UP)
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              GSTIN: 09AABCG1234F1Z5 • Store Ph: +91 98765 43210
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              Daily Settlement Statement
            </div>
            <div>
              Date: <strong className="text-slate-900">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
            </div>
            <div>
              Shift: <strong className="text-slate-900">Morning &amp; Evening Full Shift</strong>
            </div>
            <div>
              Manager: <strong className="text-slate-900">Ramesh (Duty Mgr)</strong>
            </div>
          </div>
        </div>

        {/* Financial KPI Summary Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Total Gross Collection
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">
              Cash in Hand (Drawer)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5">
              ₹{cashTotal.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-center">
            <span className="text-[10px] font-bold text-teal-700 uppercase">
              UPI / Digital Bank QR
            </span>
            <div className="text-xl sm:text-2xl font-black text-teal-800 mt-0.5">
              ₹{upiTotal.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase">
              Orders Processed
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-800 mt-0.5">
              {validOrders.length} bills
            </div>
          </div>
        </div>

        {/* Detailed Financial Ledger */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
            Shift Financial Ledger
          </h3>

          <div className="divide-y divide-slate-100 text-xs text-slate-700">
            <div className="py-2.5 flex justify-between">
              <span>Total Items / Units Sold</span>
              <strong className="text-slate-900">{totalItemsSold} units</strong>
            </div>
            <div className="py-2.5 flex justify-between">
              <span>Average Customer Basket (AOV)</span>
              <strong className="text-slate-900">₹{avgOrderValue}</strong>
            </div>
            <div className="py-2.5 flex justify-between text-emerald-700">
              <span>Discount &amp; Coupons Granted</span>
              <strong>-₹{totalDiscount.toFixed(0)}</strong>
            </div>
            <div className="py-2.5 flex justify-between text-slate-500">
              <span>Estimated GST (5% Grocery avg)</span>
              <strong>₹{estGst}</strong>
            </div>
            <div className="py-3 flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-900">
              <span>Net Settled Store Revenue</span>
              <span className="text-base text-brand-600">₹{totalRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Recent Shift Orders List */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
            Processed Orders Record ({validOrders.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Order #</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Mode</th>
                  <th className="py-2 px-3">Items</th>
                  <th className="py-2 px-3 text-right">Bill Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {validOrders.slice(0, 10).map((o) => (
                  <tr key={o.id}>
                    <td className="py-2 px-3 font-bold text-slate-900">#{o.orderNumber}</td>
                    <td className="py-2 px-3 text-slate-700">{o.customerName}</td>
                    <td className="py-2 px-3 font-semibold uppercase text-slate-600">{o.paymentMethod}</td>
                    <td className="py-2 px-3 text-slate-500">{o.items.length} items</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">₹{o.total.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shift Sign-off & Verification Box */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-8">
            <span className="font-bold text-slate-700 uppercase text-[10px] block">
              Cashier Shift Handover
            </span>
            <div className="border-b border-slate-400 w-48" />
            <span className="text-slate-500 text-[11px]">Cashier Signature / Date</span>
          </div>

          <div className="space-y-8 text-right">
            <span className="font-bold text-slate-700 uppercase text-[10px] block">
              Verified by Store Manager
            </span>
            <div className="border-b border-slate-400 w-48 ml-auto" />
            <span className="text-slate-500 text-[11px]">Manager Signature (Naugarh Branch)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
