"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Order } from "@/types";
import { updateOrderStatus, getOrders } from "@/lib/actions";

export default function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Auto-sync Admin orders every 4 seconds
  React.useEffect(() => {
    let isMounted = true;

    const fetchLatestOrders = async () => {
      try {
        const latest = await getOrders();
        if (isMounted && latest) {
          setOrders(latest as any);
        }
      } catch (err) {
        console.error("Admin orders auto-sync error:", err);
      }
    };

    const interval = setInterval(fetchLatestOrders, 4000);
    const handleFocus = () => fetchLatestOrders();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const filteredOrders = orders.filter((o) => {
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

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, status);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (res.order as any) : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(res.order as any);
        }
      }
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "DELIVERED":
        return { label: "Delivered", bg: "bg-emerald-950 text-emerald-300 border-emerald-800" };
      case "OUT_FOR_DELIVERY":
        return { label: "Out for Delivery", bg: "bg-purple-950 text-purple-300 border-purple-800" };
      case "PACKING":
        return { label: "Packing", bg: "bg-blue-950 text-blue-300 border-blue-800" };
      case "CONFIRMED":
        return { label: "Confirmed", bg: "bg-amber-950 text-amber-300 border-amber-800" };
      case "CANCELLED":
        return { label: "Cancelled", bg: "bg-rose-950 text-rose-300 border-rose-800" };
      default:
        return { label: s, bg: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const tabs = [
    { key: "ALL", label: "All Orders", count: orders.length },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      count: orders.filter((o) => o.status === "CONFIRMED").length,
    },
    {
      key: "PACKING",
      label: "Packing",
      count: orders.filter((o) => o.status === "PACKING").length,
    },
    {
      key: "OUT_FOR_DELIVERY",
      label: "Out for Delivery",
      count: orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length,
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      count: orders.filter((o) => o.status === "DELIVERED").length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            Order Fulfillment
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Customer Orders ({orders.length})
          </h1>
          <p className="text-xs text-slate-400">
            Dispatch, pack, and monitor customer grocery deliveries
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, phone, name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5">Bill</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Status Flow</th>
                <th className="px-4 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No orders match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-black text-white">#{order.orderNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400">
                        {order.items.length} items
                        <span className="block text-[10px] text-slate-500 truncate max-w-[140px]">
                          {order.items.map((i) => i.productName).join(", ")}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-white">
                        ₹{order.total.toFixed(0)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block text-[10px] font-bold text-amber-300 uppercase">
                          {order.paymentMethod}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${badge.bg}`}
                            >
                              <option value="CONFIRMED" className="bg-slate-900 text-amber-300">
                                Confirmed
                              </option>
                              <option value="PACKING" className="bg-slate-900 text-blue-300">
                                Packing
                              </option>
                              <option value="OUT_FOR_DELIVERY" className="bg-slate-900 text-purple-300">
                                Out for Delivery
                              </option>
                              <option value="DELIVERED" className="bg-slate-900 text-emerald-300">
                                Delivered
                              </option>
                              <option value="CANCELLED" className="bg-slate-900 text-rose-300">
                                Cancelled
                              </option>
                            </select>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl font-bold text-[11px] border border-slate-700/60 inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs font-bold text-brand-400">Grocery for All Supermarket</div>
                <h2 className="text-lg font-black text-white">
                  Order Details #{selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold block">Customer Info</span>
                <strong className="text-white block text-sm">{selectedOrder.customerName}</strong>
                <p className="text-slate-400">{selectedOrder.customerPhone}</p>
                <p className="text-slate-400">{selectedOrder.customerAddress}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold block">Delivery &amp; Payment</span>
                <p className="text-slate-300">
                  Slot: <strong>{selectedOrder.deliverySlot}</strong>
                </p>
                <p className="text-slate-300">
                  Payment: <strong>{selectedOrder.paymentMethod}</strong> ({selectedOrder.paymentStatus})
                </p>
                {selectedOrder.notes && (
                  <p className="text-amber-400/90 italic">Note: {selectedOrder.notes}</p>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Items ({selectedOrder.items.length})
              </h3>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{item.productName}</span>
                      <span className="text-slate-500 block text-[11px]">
                        {item.quantity} × {item.unit} @ ₹{item.price}
                      </span>
                    </div>
                    <span className="font-bold text-white">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Total Bill Payable</span>
                <div className="text-xl font-black text-amber-300">
                  ₹{selectedOrder.total.toFixed(0)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/orders/${selectedOrder.orderNumber}`}
                  target="_blank"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
                >
                  Customer View
                </Link>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
