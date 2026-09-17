"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { updateOrderStatus } from "@/lib/actions";
import { CheckCircle2, Clock, Package, Truck, XCircle, Loader2 } from "lucide-react";

export default function AdminOrderRow({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus(order.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "DELIVERED":
        return "text-emerald-400 bg-emerald-950/70 border-emerald-800";
      case "OUT_FOR_DELIVERY":
        return "text-purple-400 bg-purple-950/70 border-purple-800";
      case "PACKING":
        return "text-blue-400 bg-blue-950/70 border-blue-800";
      case "CONFIRMED":
        return "text-amber-400 bg-amber-950/70 border-amber-800";
      case "CANCELLED":
        return "text-rose-400 bg-rose-950/70 border-rose-800";
      default:
        return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  return (
    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <Link
          href={`/orders/${order.orderNumber}`}
          className="font-bold text-white hover:text-brand-400 transition-colors"
        >
          #{order.orderNumber}
        </Link>
        <span className="text-slate-400 truncate max-w-[140px] font-medium">
          {order.customerName}
        </span>
        <span className="text-slate-500 text-[11px] hidden md:inline">
          ({order.items.length} items)
        </span>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="font-black text-white text-xs">₹{order.total.toFixed(0)}</span>

        {/* Status Dropdown */}
        <div className="relative flex items-center gap-1.5">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          ) : (
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${getStatusColor(
                status
              )}`}
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
      </div>
    </div>
  );
}
