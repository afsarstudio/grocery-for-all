"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Phone,
  MapPin,
  Sparkles,
  Gift,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  LogOut,
  ShoppingBag,
  Coins,
  TrendingUp,
  Receipt,
  Edit2,
  Check,
  ShieldCheck,
  Award,
  ChevronRight,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customerAuthContext";
import { getCustomerOrders } from "@/lib/actions";
import { Order } from "@/types";

export default function CustomerAccountPage() {
  const { customer, isLoggedIn, isLoading, logout, openAuthModal, updateProfile, refreshCustomer } =
    useCustomerAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressVal, setEditAddressVal] = useState("");
  const [editNameVal, setEditNameVal] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch customer orders and live auto-poll for status updates (e.g. Admin changes CONFIRMED -> DELIVERED)
  useEffect(() => {
    if (!customer?.phone) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setEditAddressVal(customer.address || "");
    setEditNameVal(customer.name || "");

    let isMounted = true;

    const fetchOrdersSilently = async () => {
      try {
        const data = await getCustomerOrders(customer.phone);
        if (isMounted && data) {
          setOrders(data as any);
        }
      } catch (err) {
        console.error("Live order polling error:", err);
      }
    };

    // Initial load with loader
    setOrdersLoading(true);
    fetchOrdersSilently().finally(() => {
      if (isMounted) setOrdersLoading(false);
    });

    // Auto poll every 3 seconds for instant real-time status updates without refresh
    const pollInterval = setInterval(() => {
      fetchOrdersSilently();
    }, 3000);

    // Also refresh immediately when tab gets focused
    const handleFocus = () => {
      fetchOrdersSilently();
      refreshCustomer();
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, [customer?.phone, refreshCustomer]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.id) return;
    const ok = await updateProfile({
      name: editNameVal.trim(),
      address: editAddressVal.trim(),
    });
    if (ok) {
      setIsEditingAddress(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto" />
          <div className="h-6 bg-slate-200 rounded-xl w-3/4 mx-auto" />
          <div className="h-4 bg-slate-200 rounded-lg w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!isLoggedIn || !customer) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-card space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-amber-100 rounded-3xl flex items-center justify-center text-brand-600 mx-auto shadow-inner border border-amber-200">
            <User className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              <span>Get 50 Welcome Points on Signup!</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Customer Account &amp; Rewards
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in with your mobile number to view your loyalty points, track orders live, and enjoy express checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal("login")}
              className="w-full sm:w-auto px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-glow transition-all"
            >
              Sign In with Mobile
            </button>
            <button
              onClick={() => openAuthModal("signup")}
              className="w-full sm:w-auto px-8 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create New Account</span>
            </button>
          </div>

          {/* Quick benefits list */}
          <div className="pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Loyalty Points</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Earn 1 Point per ₹10 spent. Redeem points directly for cash discounts.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-600" />
                <span>30-Min Live Tracking</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Track your Naugarh &amp; Tetari Bazar orders in real-time from packing to delivery.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Instant Invoices</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Access and download full GST itemized bills for all past orders anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate lifetime metrics
  const totalSpent = orders.reduce(
    (sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum),
    0
  );
  const totalItemsPurchased = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const activeOrders = orders.filter(
    (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PACKING" || o.status === "OUT_FOR_DELIVERY"
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* 1. Header Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-white/20 flex-shrink-0">
              {customer.name?.charAt(0).toUpperCase() || "C"}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {customer.name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Naugarh Gold Member</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+91 {customer.phone}</span>
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  <span className="truncate max-w-[200px]">
                    {customer.address || "Naugarh, Tetari Bazar, UP"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsEditingAddress(!isEditingAddress)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingAddress ? "Cancel" : "Edit Profile"}</span>
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/60 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditingAddress && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={editNameVal}
                onChange={(e) => setEditNameVal(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Delivery Address in Naugarh
              </label>
              <input
                type="text"
                required
                value={editAddressVal}
                onChange={(e) => setEditAddressVal(e.target.value)}
                placeholder="House No, Landmark, Naugarh 272207"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {saveSuccess && (
          <div className="mt-3 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Profile updated successfully!</span>
          </div>
        )}
      </div>

      {/* 2. Three Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Points Card */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-6 shadow-card space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
              Loyalty Points Wallet
            </span>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
              ⭐ {customer.points || 0}
            </div>
            <div className="text-xs font-bold text-amber-100 mt-1">
              Worth ₹{(customer.points || 0).toFixed(0)} instant checkout discount
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 text-[11px] text-amber-100 flex items-center justify-between">
            <span>1 Point = ₹1.00</span>
            <span className="font-bold">Earn 1 pt per ₹10 spent</span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Supermarket Orders
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              {orders.length}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              {totalItemsPurchased} total grocery items delivered
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Active in Transit:</span>
            <span className="font-bold text-brand-600">{activeOrders.length} orders</span>
          </div>
        </div>

        {/* Lifetime Spend & Savings Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Grocery Spent
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              ₹{totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Naugarh Express Fast Delivery</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Delivery Area:</span>
            <span className="font-bold text-slate-800">Tetari Bazar (272207)</span>
          </div>
        </div>
      </div>

      {/* 3. Customer's Orders History List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <span>My Orders &amp; Invoices ({orders.length})</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Track live order status, reorder items or download invoices in real-time
            </p>
          </div>

          <Link
            href="/products"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 w-fit"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop More Groceries</span>
          </Link>
        </div>

        {ordersLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-card space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your cart is waiting! Place your first grocery order and earn your loyalty points.
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
                  {/* Order Header */}
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
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl text-xs"
                          >
                            <span className="font-bold text-slate-900">
                              {item.quantity}×
                            </span>
                            <span className="text-slate-700 truncate max-w-[140px]">
                              {item.productName}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              ({item.unit})
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Delivery Address: {order.customerAddress}</span>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
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
                        className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow"
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
    </div>
  );
}
