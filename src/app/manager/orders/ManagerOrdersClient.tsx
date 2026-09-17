"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  Eye,
  X,
  Printer,
  MapPin,
  Phone,
  Store,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Order } from "@/types";
import { updateOrderStatus, getOrders } from "@/lib/actions";
import confetti from "canvas-confetti";

export default function ManagerOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);
  const selectedOrderRef = useRef<Order | null>(selectedOrder);

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  // High-efficiency live sync
  const fetchLatestOrders = useCallback(async (showSpin = false) => {
    if (isFetchingRef.current) return;
    if (typeof document !== "undefined" && document.hidden && !showSpin) return;

    isFetchingRef.current = true;
    if (showSpin) setIsRefreshing(true);

    try {
      const latest = await getOrders();
      if (latest) {
        setOrders(latest as any);
        if (selectedOrderRef.current) {
          const updated = latest.find((o) => o.id === selectedOrderRef.current?.id);
          if (updated) setSelectedOrder(updated as any);
        }
      }
    } catch (err) {
      console.error("Live orders sync error:", err);
    } finally {
      isFetchingRef.current = false;
      if (showSpin) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchLatestOrders(false);
      }
    }, 12000);

    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchLatestOrders(false);
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchLatestOrders]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }

    try {
      const res = await updateOrderStatus(orderId, status);
      if (res.success && res.order) {
        if (status === "DELIVERED") {
          try {
            confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
          } catch {}
        }
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (res.order as any) : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(res.order as any);
        }
      }
    } catch (err) {
      console.error("Status update failed:", err);
      fetchLatestOrders(false);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== "ALL" && o.status !== activeTab) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
        );
      }
      return true;
    });
  }, [orders, activeTab, search]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "DELIVERED":
        return { label: "Delivered", bg: "bg-emerald-950 text-emerald-300 border-emerald-800" };
      case "OUT_FOR_DELIVERY":
        return { label: "Out for Delivery", bg: "bg-purple-950 text-purple-300 border-purple-800" };
      case "PACKING":
        return { label: "Packing Basket", bg: "bg-blue-950 text-blue-300 border-blue-800" };
      case "CONFIRMED":
        return { label: "Confirmed", bg: "bg-amber-950 text-amber-300 border-amber-800" };
      default:
        return { label: s, bg: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const tabs = [
    { key: "ALL", label: "All Orders", count: orders.length },
    { key: "CONFIRMED", label: "Confirmed", count: orders.filter((o) => o.status === "CONFIRMED").length },
    { key: "PACKING", label: "Packing Basket", count: orders.filter((o) => o.status === "PACKING").length },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", count: orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length },
    { key: "DELIVERED", label: "Delivered", count: orders.filter((o) => o.status === "DELIVERED").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Live Dispatch Control</span>
            </span>
            <span className="text-xs text-slate-400">Auto-syncing every 3s</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Orders &amp; Dispatch Desk
          </h1>
          <p className="text-xs text-slate-400">
            Process orders, assign delivery partners, and print GST receipts in Naugarh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLatestOrders(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40 font-extrabold"
                  : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.key ? "bg-teal-800 text-teal-100" : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, Name, Mobile..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order Details</th>
                <th className="py-3.5 px-4">Customer &amp; Area</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Bill &amp; Payment</th>
                <th className="py-3.5 px-4">Live Status</th>
                <th className="py-3.5 px-4 text-right">Quick Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No orders found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Order # */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-white text-sm">
                          #{order.orderNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">
                          {order.customerName}
                        </div>
                        <div className="text-[10px] text-teal-400 font-medium">
                          {order.customerPhone}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {order.customerAddress}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-300">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} items
                        </span>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {order.items.map((i) => i.productName).join(", ")}
                        </div>
                      </td>

                      {/* Bill & Payment */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-amber-400 text-sm">
                          ₹{order.total.toFixed(0)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          {order.paymentMethod} •{" "}
                          <span
                            className={
                              order.paymentStatus === "PAID"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* Live Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-1 rounded-full border ${badge.bg}`}
                        >
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Quick Dispatch Action */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, "PACKING")}
                              disabled={isUpdating}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shadow cursor-pointer"
                            >
                              Pack
                            </button>
                          )}
                          {order.status === "PACKING" && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, "OUT_FOR_DELIVERY")}
                              disabled={isUpdating}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] rounded-lg shadow cursor-pointer"
                            >
                              Dispatch
                            </button>
                          )}
                          {order.status === "OUT_FOR_DELIVERY" && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, "DELIVERED")}
                              disabled={isUpdating}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow cursor-pointer"
                            >
                              Deliver
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
                            title="View Full Slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl space-y-6 relative my-8 text-white">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="text-[11px] text-teal-400 font-bold uppercase tracking-wider">
                  Naugarh Supermarket Order Slip
                </div>
                <h3 className="text-xl font-black text-white">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl font-black text-amber-400">
                  ₹{selectedOrder.total.toFixed(0)}
                </div>
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                    getStatusBadge(selectedOrder.status).bg
                  }`}
                >
                  {getStatusBadge(selectedOrder.status).label}
                </span>
              </div>
            </div>

            {/* Customer & Delivery Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Customer
                </span>
                <div className="font-bold text-white text-sm">
                  {selectedOrder.customerName}
                </div>
                <div className="text-teal-400 font-semibold mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Delivery Address
                </span>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {selectedOrder.customerAddress}
                </p>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Slot: {selectedOrder.deliverySlot}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Order Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.quantity} × {item.unit} @ ₹{item.price}
                      </div>
                    </div>
                    <div className="font-bold text-white flex-shrink-0">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/orders/${selectedOrder.orderNumber}`}
                target="_blank"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>Print GST Invoice</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                {selectedOrder.status !== "CONFIRMED" && selectedOrder.status !== "DELIVERED" && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, "CONFIRMED")}
                    disabled={updatingId === selectedOrder.id}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Set Confirmed
                  </button>
                )}
                {selectedOrder.status !== "PACKING" && selectedOrder.status !== "DELIVERED" && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, "PACKING")}
                    disabled={updatingId === selectedOrder.id}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Set Packing
                  </button>
                )}
                {selectedOrder.status !== "OUT_FOR_DELIVERY" && selectedOrder.status !== "DELIVERED" && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, "OUT_FOR_DELIVERY")}
                    disabled={updatingId === selectedOrder.id}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Set Out for Delivery
                  </button>
                )}
                {selectedOrder.status !== "DELIVERED" && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, "DELIVERED")}
                    disabled={updatingId === selectedOrder.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Delivered</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
