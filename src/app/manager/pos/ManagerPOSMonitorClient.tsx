"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Receipt,
  Store,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Barcode,
  Users,
  Printer,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Order } from "@/types";
import { getOrders } from "@/lib/actions";

export default function ManagerPOSMonitorClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchLatest = useCallback(async (showSpin = false) => {
    if (isFetchingRef.current) return;
    if (typeof document !== "undefined" && document.hidden && !showSpin) return;

    isFetchingRef.current = true;
    if (showSpin) setIsRefreshing(true);

    try {
      const fresh = await getOrders();
      if (fresh) setOrders(fresh as any);
    } catch (err) {
      console.error("POS monitor sync error:", err);
    } finally {
      isFetchingRef.current = false;
      if (showSpin) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchLatest(false);
      }
    }, 15000);

    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchLatest(false);
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchLatest]);

  // Filter counter / POS orders vs online
  const counterOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.paymentMethod === "CASH" ||
          o.paymentMethod === "COD" ||
          o.customerAddress.includes("Counter") ||
          o.customerAddress.includes("Store")
      ),
    [orders]
  );

  const totalCounterSales = useMemo(
    () =>
      counterOrders.reduce(
        (sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum),
        0
      ),
    [counterOrders]
  );

  const cashOrders = useMemo(
    () => orders.filter((o) => o.paymentMethod === "CASH" || o.paymentMethod === "COD"),
    [orders]
  );
  const upiOrders = useMemo(
    () => orders.filter((o) => o.paymentMethod === "UPI" || o.paymentMethod === "ONLINE"),
    [orders]
  );

  const totalCash = cashOrders.reduce((sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum), 0);
  const totalUpi = upiOrders.reduce((sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Counter Operations Monitor</span>
            </span>
            <span className="text-xs text-slate-400">Terminal #1 • Tetari Bazar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Staff POS &amp; Counter Billing Desk
          </h1>
          <p className="text-xs text-slate-400">
            Monitor cashier register collections, barcode billings, and cash drawer handovers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLatest(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
            <span>Sync Register</span>
          </button>

          <Link
            href="/staff/billing"
            target="_blank"
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Launch Fullscreen POS Counter</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-teal-950 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Cash in Physical Register</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <Store className="w-3.5 h-3.5" />
              <span>Cash Drawer</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            ₹{totalCash.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-500">
            {cashOrders.length} cash / COD receipts processed
          </p>
        </div>

        <div className="bg-slate-950 border border-teal-950 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>UPI &amp; Digital Register</span>
            <span className="text-teal-400 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>UPI Digital</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-400">
            ₹{totalUpi.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-500">
            {upiOrders.length} QR / Card settlements
          </p>
        </div>

        <div className="bg-slate-950 border border-teal-950 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Counter Billings Total</span>
            <span className="text-amber-400 flex items-center gap-1 font-semibold">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Counter POS</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{(totalCash + totalUpi).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-500">
            {orders.length} total customer checkouts
          </p>
        </div>
      </div>

      {/* POS Quick Instructions & Features Banner */}
      <div className="bg-gradient-to-br from-slate-950 to-teal-950/60 border border-teal-900/50 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-teal-400" />
              <span>Cashier Counter Operational Features</span>
            </h3>
            <p className="text-xs text-slate-400">
              High-speed billing features available at Naugarh store terminal
            </p>
          </div>

          <Link
            href="/staff/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 w-fit"
          >
            <span>Open Cashier Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-bold text-teal-300 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-teal-400" />
              <span>USB / Bluetooth Barcode Scan</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Instant barcode detection for packaged groceries (Maggi, Oil, Atta, Biscuits) directly into cart.
            </p>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Hold &amp; Recall Bills</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              If a customer goes back to pick an extra item, cashier can hold the active bill and serve the next customer without losing cart items.
            </p>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>58mm / 80mm Thermal Print</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Instant GST itemized receipt printout on checkout with store address and loyalty points summary.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Counter Billings List */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-900">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-400" />
            <span>Recent Counter Billings</span>
          </h3>
          <span className="text-xs text-slate-400">
            Last {orders.slice(0, 5).length} orders
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {orders.slice(0, 8).map((order) => (
            <div
              key={order.id}
              className="py-3 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>#{order.orderNumber}</span>
                  <span className="text-slate-400 font-normal">
                    ({order.customerName})
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  • {order.items.length} items
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-amber-400 text-sm">
                  ₹{order.total.toFixed(0)}
                </div>
                <span className="text-[10px] text-teal-400 font-bold uppercase">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
