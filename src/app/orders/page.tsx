"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShoppingBag,
  Search,
  User,
  Sparkles,
  Phone,
  Gift,
  Lock,
  LogIn,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customerAuthContext";
import { getCustomerOrders } from "@/lib/actions";
import { Order } from "@/types";

export default function OrdersPage() {
  const { customer, isLoggedIn, openAuthModal } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!isLoggedIn || !customer?.phone) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrdersSilently = async (initial = false) => {
      if (initial) setLoading(true);
      try {
        const data = await getCustomerOrders(customer.phone);
        if (isMounted) setOrders((data as any) || []);
      } catch (err) {
        console.error("Orders sync error:", err);
      } finally {
        if (initial && isMounted) setLoading(false);
      }
    };

    fetchOrdersSilently(true);

    const pollInterval = setInterval(() => {
      fetchOrdersSilently(false);
    }, 3000);

    const handleFocus = () => fetchOrdersSilently(false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, [isLoggedIn, customer?.phone]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;
    setIsSearching(true);
    try {
      const results = await getCustomerOrders(searchPhone.trim());
      setOrders(results as any);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return {
          label: "Delivered",
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
        };
      case "OUT_FOR_DELIVERY":
        return {
          label: "Out for Delivery",
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Truck,
        };
      case "PACKING":
        return {
          label: "Packing Order",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Package,
        };
      case "CONFIRMED":
        return {
          label: "Confirmed",
          color: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Clock,
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 text-slate-800 border-slate-200",
          icon: Clock,
        };
    }
  };

  // If user is not logged in, show dedicated Login Wall
  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-card space-y-6">
          <div className="w-20 h-20 bg-brand-50 border border-brand-100 rounded-3xl flex items-center justify-center text-brand-600 mx-auto shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Customer Authentication Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-2">
              Sign In to View Your Orders
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Please sign in to your account to view past orders, track deliveries live, and download GST invoices.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={() => openAuthModal("login")}
              className="w-full sm:w-auto px-7 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Customer Sign In</span>
            </button>
            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Products</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-amber-700 font-semibold">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>New users receive 50 Welcome Points (₹50 discount) on signup!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* 1. Logged in customer loyalty banner */}
      {customer && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl flex-shrink-0">
              {customer.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                Logged In as {customer.name} (+91 {customer.phone})
              </div>
              <div className="text-xl sm:text-2xl font-black flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-5 h-5 text-yellow-200" />
                <span>⭐ {customer.points || 0} Loyalty Points Balance</span>
              </div>
            </div>
          </div>

          <Link
            href="/account"
            className="px-4 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <User className="w-4 h-4 text-brand-600" />
            <span>Manage My Account</span>
          </Link>
        </div>
      )}

      {/* 2. Header & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Order History &amp; Live Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {customer ? `${customer.name}'s Orders` : "My Orders"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track live 30-minute delivery or download your grocery invoices
          </p>
        </div>

        {/* Quick Search for Phone / Order Number */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Search by Order # or Phone"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            {isSearching ? "Searching..." : "Find"}
          </button>
        </form>
      </div>

      {/* 3. Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-card space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't placed any orders yet. Add grocery items to your cart and place an order!
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow hover:bg-brand-700 transition-all"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const StatusIcon = badge.icon;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-card hover:border-brand-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900">
                      Order #{order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Items preview */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Items Ordered ({order.items.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs text-slate-700 font-medium"
                        >
                          <strong className="text-slate-900 mr-1">{item.quantity}×</strong>{" "}
                          {item.productName} ({item.unit})
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Delivery to: {order.customerAddress}
                    </div>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-[11px] text-slate-400 font-bold uppercase">
                        Total Amount
                      </div>
                      <div className="text-base font-black text-slate-900">
                        ₹{order.total.toFixed(0)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">
                        {order.paymentMethod} • {order.paymentStatus}
                      </div>
                    </div>

                    <Link
                      href={`/orders/${order.orderNumber}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
