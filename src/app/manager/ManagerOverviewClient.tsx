"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  Store,
  Receipt,
  Boxes,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Check,
  Loader2,
  Banknote,
  QrCode,
  ClipboardList,
  Megaphone,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { Order, Product } from "@/types";
import { updateOrderStatus, restockProduct, getManagerOverviewData } from "@/lib/actions";
import CustomizeRestockModal from "@/components/admin/CustomizeRestockModal";

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  price: number;
  mrp?: number;
  imageUrl?: string;
  category?: any;
}

interface ManagerOverviewClientProps {
  initialKpis: {
    totalProducts: number;
    totalOrders: number;
    customersCount: number;
    lowStockProducts: number;
    totalRevenue: number;
    pendingOrdersCount: number;
  };
  initialOrders: Order[];
  initialUrgentLowStock: LowStockItem[];
  initialCashTotal: number;
  initialUpiTotal: number;
}

export default function ManagerOverviewClient({
  initialKpis,
  initialOrders,
  initialUrgentLowStock,
  initialCashTotal,
  initialUpiTotal,
}: ManagerOverviewClientProps) {
  const [kpis, setKpis] = useState(initialKpis);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [urgentLowStock, setUrgentLowStock] = useState<LowStockItem[]>(initialUrgentLowStock);
  const [cashTotal, setCashTotal] = useState(initialCashTotal);
  const [upiTotal, setUpiTotal] = useState(initialUpiTotal);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);
  const [customizingProd, setCustomizingProd] = useState<Product | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  // High-performance single server action live sync
  const fetchLatestData = useCallback(async (showSpin = false) => {
    if (isFetchingRef.current) return;
    if (typeof document !== "undefined" && document.hidden && !showSpin) return;

    isFetchingRef.current = true;
    if (showSpin) setIsRefreshing(true);

    try {
      const data = await getManagerOverviewData();
      if (data) {
        if (data.kpis) setKpis(data.kpis);
        if (data.orders) setOrders(data.orders as any);
        if (data.urgentLowStock) setUrgentLowStock(data.urgentLowStock as any);
        if (typeof data.cashTotal === "number") setCashTotal(data.cashTotal);
        if (typeof data.upiTotal === "number") setUpiTotal(data.upiTotal);
      }
    } catch (err) {
      console.error("Manager live sync error:", err);
    } finally {
      isFetchingRef.current = false;
      if (showSpin) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Poll every 12 seconds only when tab is active
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchLatestData(false);
      }
    }, 12000);

    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchLatestData(false);
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchLatestData]);

  // Quick 1-Click Order Status Handler with Optimistic UI
  const handleQuickStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (res.order as any) : o))
        );
      }
    } catch (err) {
      console.error("Order status update error:", err);
      // Rollback on error by refetching
      fetchLatestData(false);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Quick 1-Click Restock (+25 Units) with Optimistic UI
  const handleQuickRestock = async (productId: string) => {
    setRestockingId(productId);
    // Optimistic update
    setUrgentLowStock((prev) =>
      prev
        .map((p) => (p.id === productId ? { ...p, stock: p.stock + 25 } : p))
        .filter((p) => p.stock <= 15)
    );

    try {
      const res = await restockProduct(productId, 25, "Manager 1-Click Restock (+25)");
      if (res.success) {
        setRestockSuccess(productId);
        setTimeout(() => setRestockSuccess(null), 2500);
      }
    } catch (err) {
      console.error("Restock error:", err);
      fetchLatestData(false);
    } finally {
      setRestockingId(null);
    }
  };

  const handleOpenCustomize = (prod: LowStockItem) => {
    setCustomizingProd({
      id: prod.id,
      name: prod.name,
      slug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      price: prod.price,
      mrp: prod.mrp || prod.price,
      stock: prod.stock,
      unit: prod.unit,
      imageUrl: prod.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
      isFeatured: false,
      isVegetarian: true,
      categoryId: prod.category?.id || "",
      category: prod.category,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product);
  };

  const handleCustomRestockSuccess = (updatedProduct: Product) => {
    setUrgentLowStock((prev) =>
      prev
        .map((p) => (p.id === updatedProduct.id ? { ...p, stock: updatedProduct.stock } : p))
        .filter((p) => p.stock <= 15)
    );
    fetchLatestData(false);
  };

  // Memoized Calculations
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "PENDING" ||
          o.status === "CONFIRMED" ||
          o.status === "PACKING" ||
          o.status === "OUT_FOR_DELIVERY"
      ),
    [orders]
  );

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return { label: "Delivered", color: "bg-emerald-950 text-emerald-300 border-emerald-800" };
      case "OUT_FOR_DELIVERY":
        return { label: "Out for Delivery", color: "bg-purple-950 text-purple-300 border-purple-800" };
      case "PACKING":
        return { label: "Packing Order", color: "bg-blue-950 text-blue-300 border-blue-800" };
      case "CONFIRMED":
        return { label: "Confirmed", color: "bg-amber-950 text-amber-300 border-amber-800" };
      default:
        return { label: status, color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Manager Live Desk</span>
            </span>
            <span className="text-xs text-slate-400">
              Tetari Bazar, Naugarh 272207
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Store Operations &amp; Dispatch Hub
          </h1>
          <p className="text-xs text-slate-400">
            Real-time grocery inventory, cashier billings, and live order tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchLatestData(true)}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
            <span>Sync Live</span>
          </button>

          <Link
            href="/manager/orders"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/40 transition-colors flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Dispatch Desk ({activeOrders.length})</span>
          </Link>

          <Link
            href="/staff/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>Open POS Billing</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Store Revenue */}
        <div className="bg-slate-950/80 border border-teal-950 p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Store Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              ₹{kpis.totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-teal-400 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Counter POS + Home Delivery</span>
            </div>
          </div>
        </div>

        {/* Active Dispatch Queue */}
        <div className="bg-slate-950/80 border border-teal-950 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Orders Queue
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {activeOrders.length}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {kpis.totalOrders} total orders processed
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-950/80 border border-teal-950 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400">
              {urgentLowStock.length}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Products with stock ≤ 15 units
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-slate-950/80 border border-teal-950 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Customers
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {kpis.customersCount}
            </div>
            <div className="text-[11px] text-teal-400 font-semibold mt-0.5">
              With 50 Welcome Reward Points
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cashier Collection Split & Quick Stats Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 border border-teal-900/40 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-400" />
              <span>Shift Payment Collection Split</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cash in drawer vs UPI / QR direct settlement
            </p>
          </div>
          <Link
            href="/manager/reports"
            className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
          >
            <span>View Full Closing Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              <span>Physical Cash Register</span>
            </span>
            <div className="text-xl font-black text-emerald-400">
              ₹{cashTotal.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-slate-500">
              Cash collected at store counter &amp; COD
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>UPI &amp; Digital Register</span>
            </span>
            <div className="text-xl font-black text-teal-400">
              ₹{upiTotal.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-slate-500">
              Direct bank transfer via Naugarh Kirana QR
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Average Basket Size</span>
            </span>
            <div className="text-xl font-black text-amber-400">
              ₹{kpis.totalOrders > 0 ? (kpis.totalRevenue / kpis.totalOrders).toFixed(0) : "0"}
            </div>
            <p className="text-[10px] text-slate-500">
              Per customer basket size
            </p>
          </div>
        </div>
      </div>

      {/* 4. Manager Operations Command Grid + Urgent Restock Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Store Operations & Department Desks (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-teal-400" />
              <span>Store Operations &amp; Department Desks</span>
            </h2>
            <span className="text-xs text-slate-400">
              Tetari Bazar Supermarket
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Orders & Dispatch */}
            <Link
              href="/manager/orders"
              className="p-5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-700/60 rounded-2xl transition-all group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {activeOrders.length} Active Orders
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors flex items-center justify-between">
                  <span>Orders &amp; Dispatch Desk</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Manage incoming customer orders, packing baskets, and status workflows
                </p>
              </div>
            </Link>

            {/* 2. Rider Dispatch Desk */}
            <Link
              href="/manager/dispatch"
              className="p-5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-700/60 rounded-2xl transition-all group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Express Fleet
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors flex items-center justify-between">
                  <span>Rider Dispatch Desk</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Assign delivery boys and generate instant formatted WhatsApp delivery slips
                </p>
              </div>
            </Link>

            {/* 3. Cash Drawer & Float */}
            <Link
              href="/manager/cash-drawer"
              className="p-5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-700/60 rounded-2xl transition-all group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ₹{cashTotal.toLocaleString("en-IN")} In Drawer
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                  <span>Cash Drawer &amp; Float Register</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Physical currency count, petty expense payouts, and cashier reconciliation
                </p>
              </div>
            </Link>

            {/* 4. POS Counter Monitor */}
            <Link
              href="/manager/pos"
              className="p-5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-700/60 rounded-2xl transition-all group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Terminal #1
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors flex items-center justify-between">
                  <span>POS Counter Operations</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Monitor cashier billing transactions, hold/recall bills, and thermal print receipts
                </p>
              </div>
            </Link>

            {/* 5. Store Notice & Broadcast */}
            <Link
              href="/manager/broadcast"
              className="p-5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-700/60 rounded-2xl transition-all group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Storefront
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-rose-300 transition-colors flex items-center justify-between">
                  <span>Store Live Notice &amp; Broadcast</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Publish delivery alerts, rain delay notices, and flash promos on customer site
                </p>
              </div>
            </Link>

            {/* 6. Customer Loyalty CRM */}
            <Link
              href="/manager/customers"
              className="p-5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-700/60 rounded-2xl transition-all group shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {kpis.customersCount} Shoppers
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors flex items-center justify-between">
                  <span>Customer Loyalty &amp; CRM</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  View customer directory, loyalty point balances, and one-tap WhatsApp connect
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right: Urgent Restock & Fast Ops (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Low Stock Quick Restock</span>
            </h2>
            <Link
              href="/manager/inventory"
              className="text-xs text-teal-400 hover:text-teal-300 font-bold"
            >
              All Stock
            </Link>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            {urgentLowStock.length === 0 ? (
              <div className="text-center py-6 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                All products in store have healthy stock!
              </div>
            ) : (
              urgentLowStock.map((prod) => {
                const isRestocking = restockingId === prod.id;
                const isSuccess = restockSuccess === prod.id;

                return (
                  <div
                    key={prod.id}
                    className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-rose-400 font-semibold mt-0.5 flex items-center gap-1.5">
                        <span>Stock: {prod.stock} {prod.unit}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">₹{prod.price}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleQuickRestock(prod.id)}
                        disabled={isRestocking}
                        className="px-2 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        title="1-Click Quick Restock (+25 Units)"
                      >
                        {isRestocking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>+25 Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+25</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenCustomize(prod)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-teal-700/40 text-slate-300 hover:text-white font-bold text-[11px] rounded-lg border border-slate-700 hover:border-teal-500/50 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        title="Customize restock quantity & audit reason"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-teal-400" />
                        <span>Custom</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <Link
              href="/manager/inventory"
              className="block text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors mt-2"
            >
              Open Inventory &amp; Price Desk
            </Link>
          </div>
        </div>
      </div>

      {/* Customize Restock Modal */}
      <CustomizeRestockModal
        isOpen={Boolean(customizingProd)}
        product={customizingProd}
        onClose={() => setCustomizingProd(null)}
        onRestockSuccess={handleCustomRestockSuccess}
      />
    </div>
  );
}
