"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  Phone,
  ArrowLeft,
  Store,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Order } from "@/types";
import { getOrderById } from "@/lib/actions";
import OrderPrintButton from "./OrderPrintButton";
import confetti from "canvas-confetti";

interface OrderTrackingClientProps {
  initialOrder: Order;
}

export default function OrderTrackingClient({ initialOrder }: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const steps = [
    { key: "CONFIRMED", title: "Order Confirmed", desc: "Supermarket received your order" },
    { key: "PACKING", title: "Packing Basket", desc: "Items gathered from grocery shelves" },
    { key: "OUT_FOR_DELIVERY", title: "Out for Delivery", desc: "Delivery partner en-route in Naugarh" },
    { key: "DELIVERED", title: "Delivered", desc: "Delivered at your doorstep" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PACKING":
        return 2;
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 1;
    }
  };

  // Real-time live polling every 3 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const fresh = await getOrderById(initialOrder.orderNumber || initialOrder.id);
        if (isMounted && fresh) {
          if (fresh.status !== order.status && fresh.status === "DELIVERED") {
            try {
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            } catch {}
          }
          setOrder(fresh as any);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Order live tracking error:", err);
      }
    };

    const interval = setInterval(fetchLatest, 3000);
    const handleFocus = () => fetchLatest();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, [initialOrder.orderNumber, initialOrder.id, order.status]);

  const currentStep = getStepIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex items-center gap-3">
          <OrderPrintButton orderNumber={order.orderNumber} />
          <Link
            href="/products"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Order More
          </Link>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        {/* Header with store details */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Grocery for All • Naugarh
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Tracking Active</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="text-left sm:text-right bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <div className="text-[11px] text-slate-300">Total Bill</div>
              <div className="text-2xl font-black text-amber-300">
                ₹{order.total.toFixed(0)}
              </div>
              <div className="text-[10px] text-slate-200 font-semibold uppercase">
                {order.paymentMethod} • {order.paymentStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Live Tracking Progress Bar */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-600" />
              <span>Live Delivery Timeline</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">
              Updates in real-time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isCompleted = currentStep >= stepNumber;
              const isCurrent = currentStep === stepNumber;

              return (
                <div
                  key={step.key}
                  className="flex sm:flex-col items-center sm:items-center gap-3 text-left sm:text-center relative transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                      isCompleted
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "bg-slate-200 text-slate-500"
                    } ${isCurrent ? "ring-4 ring-emerald-300 scale-105 animate-pulse" : ""}`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNumber}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        isCompleted ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[10px] text-slate-500 max-w-[140px] hidden sm:block">
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Details & Items */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left: Items list */}
          <div className="md:col-span-7 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              Purchased Items ({order.items.length})
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {order.items.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-200 flex-shrink-0">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity} × {item.unit} @ ₹{item.price}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-xs text-slate-900 flex-shrink-0">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Bill summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{order.discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount</span>
                <span>₹{order.total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Right: Customer & Delivery information */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                Delivery Details
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">{order.customerName}</strong>
                    <p className="text-slate-600">{order.customerAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-800 font-medium">{order.customerPhone}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-800 font-medium">Slot: {order.deliverySlot}</span>
                </div>

                {order.notes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-500 italic">
                    Note: &quot;{order.notes}&quot;
                  </div>
                )}
              </div>
            </div>

            {/* Store contact info */}
            <div className="bg-brand-50 p-4 rounded-2xl border border-brand-200 text-xs text-brand-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Store className="w-4 h-4 text-brand-600" />
                <span>Dispatched from Grocery for All</span>
              </div>
              <p className="text-[11px] text-brand-800">
                Rahul Nagar, Khajuriya, Tetari Bazar, Naugarh 272207.
                Need help with your order? Call <strong>+91 98765 43210</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
