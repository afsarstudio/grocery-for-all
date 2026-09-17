"use client";

import React, { useState, useMemo } from "react";
import { Order } from "@/types";
import { assignOrderRider, updateOrderStatus } from "@/lib/actions";
import {
  Truck,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Send,
  MessageCircle,
  UserCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: "available" | "on_delivery" | "offline";
}

const DEFAULT_RIDERS: Rider[] = [
  { id: "r1", name: "Sonu Yadav (Express)", phone: "+91 98765 11221", vehicle: "Bike (UP-55-AB-1234)", status: "available" },
  { id: "r2", name: "Rajesh Kumar (Tetari)", phone: "+91 98765 22332", vehicle: "EV Scooter (UP-55-EV-5678)", status: "available" },
  { id: "r3", name: "Amit Verma (Naugarh)", phone: "+91 98765 33443", vehicle: "Bike (UP-55-XY-9012)", status: "on_delivery" },
  { id: "r4", name: "Vicky Shrivastava", phone: "+91 98765 44554", vehicle: "Bicycle (Local)", status: "available" },
];

export default function ManagerDispatchClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [riders, setRiders] = useState<Rider[]>(DEFAULT_RIDERS);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ACTIVE" | "OUT" | "DELIVERED" | "ALL">("ACTIVE");
  const [selectedRiderMap, setSelectedRiderMap] = useState<Record<string, string>>({});
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  // Filter relevant orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeFilter === "ACTIVE") {
        if (o.status !== "PENDING" && o.status !== "CONFIRMED" && o.status !== "PACKING") return false;
      } else if (activeFilter === "OUT") {
        if (o.status !== "OUT_FOR_DELIVERY") return false;
      } else if (activeFilter === "DELIVERED") {
        if (o.status !== "DELIVERED") return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.customerAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, activeFilter, search]);

  const handleAssignRider = async (order: Order) => {
    const riderId = selectedRiderMap[order.id] || riders[0].id;
    const rider = riders.find((r) => r.id === riderId) || riders[0];

    setIsAssigning(order.id);
    try {
      const res = await assignOrderRider(order.id, rider.name, rider.phone);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? (res.order as any) : o))
        );
      }
    } catch (err) {
      console.error("Failed to assign rider:", err);
    } finally {
      setIsAssigning(null);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    setIsAssigning(orderId);
    try {
      const res = await updateOrderStatus(orderId, "DELIVERED");
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (res.order as any) : o))
        );
      }
    } catch (err) {
      console.error("Failed to mark delivered:", err);
    } finally {
      setIsAssigning(null);
    }
  };

  const generateWhatsAppSlip = (order: Order) => {
    const riderId = selectedRiderMap[order.id];
    const rider = riders.find((r) => r.id === riderId);

    const itemsSummary = order.items
      .map((i, idx) => `${idx + 1}. ${i.productName} (${i.quantity} ${i.unit}) - ₹${i.price * i.quantity}`)
      .join("\n");

    const text = `*GROCERY FOR ALL - DELIVERY DISPATCH*
━━━━━━━━━━━━━━━━━━━
*Order #:* ${order.orderNumber}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Address:* ${order.customerAddress}
*Assigned Rider:* ${rider ? rider.name : "Store Express Rider"}
━━━━━━━━━━━━━━━━━━━
*ITEMS TO DELIVER:*
${itemsSummary}
━━━━━━━━━━━━━━━━━━━
*TOTAL BILL:* ₹${order.total.toFixed(0)}
*PAYMENT MODE:* ${order.paymentMethod === "COD" ? `COLLECT CASH ₹${order.total.toFixed(0)}` : "PAID (UPI/Online)"}
━━━━━━━━━━━━━━━━━━━
*Store:* Grocery for All Supermarket, Tetari Bazar, Naugarh
*Support Helpline:* +91 98765 43210`;

    const encoded = encodeURIComponent(text);
    const riderPhoneDigits = rider?.phone.replace(/[^0-9]/g, "");
    const targetUrl = riderPhoneDigits && riderPhoneDigits.length >= 10
      ? `https://wa.me/${riderPhoneDigits}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(targetUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5" />
              <span>Live Delivery Ops</span>
            </span>
            <span className="text-xs text-slate-400">
              Tetari Bazar &amp; Naugarh Express Fleet
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Delivery Boy &amp; WhatsApp Dispatch Desk
          </h1>
          <p className="text-xs text-slate-400">
            Assign orders to delivery riders, generate instant WhatsApp delivery slips, and monitor live deliveries
          </p>
        </div>
      </div>

      {/* 4 Fleet Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {riders.map((rider) => (
          <div
            key={rider.id}
            className="p-4 bg-slate-950 border border-teal-950 rounded-2xl flex items-center justify-between gap-3 shadow"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate">{rider.name}</div>
                <div className="text-[11px] text-slate-400">{rider.phone}</div>
                <div className="text-[10px] text-teal-400 font-medium">{rider.vehicle}</div>
              </div>
            </div>
            <span
              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                rider.status === "available"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}
            >
              {rider.status === "available" ? "Ready" : "On Way"}
            </span>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter("ACTIVE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilter === "ACTIVE"
                ? "bg-teal-600 text-white shadow"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Pending Dispatch ({orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PACKING").length})
          </button>
          <button
            onClick={() => setActiveFilter("OUT")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilter === "OUT"
                ? "bg-purple-600 text-white shadow"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Out for Delivery ({orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length})
          </button>
          <button
            onClick={() => setActiveFilter("DELIVERED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilter === "DELIVERED"
                ? "bg-emerald-600 text-white shadow"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Completed Delivered
          </button>
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeFilter === "ALL"
                ? "bg-slate-700 text-white shadow"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Orders
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order, customer, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No orders found in this dispatch category.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isOut = order.status === "OUT_FOR_DELIVERY";
            const isDelivered = order.status === "DELIVERED";
            const currentRiderId = selectedRiderMap[order.id] || riders[0].id;
            const isBusy = isAssigning === order.id;

            return (
              <div
                key={order.id}
                className="p-4 sm:p-5 bg-slate-950 border border-slate-800/80 rounded-2xl hover:border-teal-900/60 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Order Details Left */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-white">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        isDelivered
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : isOut
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs font-bold text-teal-400">
                      ₹{order.total.toFixed(0)} ({order.paymentMethod})
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-semibold flex flex-wrap items-center gap-3">
                    <span className="text-white">{order.customerName}</span>
                    <span className="text-slate-500">•</span>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customerPhone}</span>
                    </a>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>{order.customerAddress}</span>
                  </div>

                  {/* Items preview */}
                  <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                    <strong className="text-slate-300 font-semibold">Items ({order.items.length}): </strong>
                    <span>
                      {order.items.map((i) => `${i.productName} (${i.quantity})`).join(", ")}
                    </span>
                  </div>

                  {order.notes && (
                    <div className="text-[10px] text-amber-300/90 font-medium">
                      Note / Tag: {order.notes}
                    </div>
                  )}
                </div>

                {/* Dispatch Actions Right */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-2.5 lg:min-w-[280px]">
                  {/* Select Delivery Rider Dropdown */}
                  {!isDelivered && (
                    <select
                      value={currentRiderId}
                      onChange={(e) =>
                        setSelectedRiderMap((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
                    >
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          Rider: {r.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* WhatsApp Slip Button */}
                    <button
                      onClick={() => generateWhatsAppSlip(order)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial"
                      title="Generate formatted WhatsApp delivery slip to Rider or Customer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Slip</span>
                    </button>

                    {/* Dispatch Action */}
                    {!isDelivered && !isOut && (
                      <button
                        onClick={() => handleAssignRider(order)}
                        disabled={isBusy}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial"
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                        <span>Dispatch Rider</span>
                      </button>
                    )}

                    {isOut && (
                      <button
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={isBusy}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial"
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Mark Delivered</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
