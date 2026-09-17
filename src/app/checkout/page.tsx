"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Loader2,
  CheckCircle,
  Truck,
  Store,
} from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { useCustomerAuth } from "@/lib/customerAuthContext";
import { createOrder } from "@/lib/actions";
import confetti from "canvas-confetti";

export default function CheckoutPage() {
  const router = useRouter();
  const { customer, isLoggedIn, refreshCustomer, openAuthModal } = useCustomerAuth();
  const {
    items,
    subtotal,
    mrpTotal,
    discount,
    deliveryFee,
    total,
    appliedCoupon,
    clearCart,
  } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("Express (30-45 mins)");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-populate customer fields if logged in
  React.useEffect(() => {
    if (customer) {
      if (!name && customer.name) setName(customer.name);
      if (!phone && customer.phone) setPhone(customer.phone);
      if (!email && customer.email) setEmail(customer.email);
      if (!address && customer.address) setAddress(customer.address);
    }
  }, [customer]);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Your basket is empty</h2>
          <p className="text-xs text-slate-500 mb-6">Add items before proceeding to checkout</p>
          <Link
            href="/products"
            className="px-6 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow"
          >
            Shop Groceries
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Please enter your complete delivery address in Naugarh.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        customerAddress: address.trim(),
        deliverySlot,
        paymentMethod,
        notes: notes.trim() || undefined,
        couponCode: appliedCoupon?.code,
        items: items.map((i) => ({
          productId: i.id,
          productName: i.name,
          productImage: i.imageUrl,
          price: i.price,
          quantity: i.quantity,
          unit: i.unit,
        })),
      };

      const result = await createOrder(orderData);

      if (result.success && result.order) {
        // Refresh customer profile & loyalty points
        await refreshCustomer();

        // Confetti effect
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas not ready
        }

        clearCart();
        router.push(`/orders/${result.order.orderNumber}`);
      } else {
        setErrorMsg(result.error || "Failed to place order. Please try again.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMsg("An unexpected error occurred while placing your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Supermarket Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Fast home delivery from Grocery for All (Tetari Bazar, Naugarh)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Shipping & Payment Details */}
        <div className="lg:col-span-8 space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. Customer Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>Delivery &amp; Contact Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Verma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number (+91) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98380 12345"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rajesh@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Delivery Address in Naugarh / Tetari Bazar *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / Flat No., Landmark, Rahul Nagar / Khajuriya / Tetari Bazar, Naugarh 272207"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Delivery Instructions / Landmark Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Near Shiv Mandir, call before arriving"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* 2. Delivery Slot Picker */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                2
              </span>
              <span>Preferred Delivery Time Slot</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "Express (30-45 mins)",
                  title: "⚡ Express 30-45 Mins",
                  desc: "Immediate packing and quick bike delivery",
                },
                {
                  id: "Evening Slot (5 PM - 8 PM)",
                  title: "🌆 Evening Delivery (5-8 PM)",
                  desc: "Delivered fresh before dinner",
                },
                {
                  id: "Tomorrow Morning (8 AM - 11 AM)",
                  title: "🌅 Tomorrow Morning (8-11 AM)",
                  desc: "Early morning grocery basket",
                },
                {
                  id: "Store Self-Pickup",
                  title: "🏬 Store Pickup (Tetari Bazar)",
                  desc: "Pick up packed bag directly from supermarket",
                },
              ].map((slot) => (
                <label
                  key={slot.id}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    deliverySlot === slot.id
                      ? "border-brand-600 bg-brand-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliverySlot"
                    value={slot.id}
                    checked={deliverySlot === slot.id}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                    className="mt-1 accent-brand-600"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{slot.title}</div>
                    <div className="text-[11px] text-slate-500">{slot.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                3
              </span>
              <span>Payment Option</span>
            </h2>

            <div className="space-y-3">
              {[
                {
                  id: "COD",
                  title: "Cash on Delivery / Pay on Delivery",
                  desc: "Pay cash or scan QR when delivery agent arrives",
                  icon: Banknote,
                },
                {
                  id: "UPI",
                  title: "Instant UPI (Google Pay / PhonePe / Paytm)",
                  desc: "Seamless UPI QR Code & instant confirmation",
                  icon: QrCode,
                },
                {
                  id: "CARD",
                  title: "Debit / Credit Card / NetBanking",
                  desc: "All major Visa, Mastercard, and RuPay cards accepted",
                  icon: CreditCard,
                },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <label
                    key={method.id}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/60 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={isSelected}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-brand-600"
                      />
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{method.title}</div>
                        <div className="text-[11px] text-slate-500">{method.desc}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-5 sticky top-24">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Order Summary ({items.length} items)
            </h3>

            {/* Quick item preview */}
            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="truncate max-w-[170px]">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-400 block text-[11px]">
                      {item.quantity} × {item.unit}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost breakdown */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Supermarket Price</span>
                <span className="font-bold text-slate-800">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-₹{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                <span>Total Payable</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {/* Loyalty Points Earn Banner */}
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl text-xs space-y-1">
              <div className="flex items-center justify-between text-amber-900 font-extrabold">
                <span className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Grocery Rewards</span>
                </span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  +{Math.max(5, Math.floor(total / 10))} Points
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                {isLoggedIn && customer
                  ? `You'll earn ${Math.max(5, Math.floor(total / 10))} points on this order! Current balance: ${customer.points || 0} pts.`
                  : `Sign in to credit ${Math.max(5, Math.floor(total / 10))} loyalty reward points to your account.`}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-glow flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Your Order...</span>
                </>
              ) : (
                <>
                  <span>Place Order • ₹{total.toFixed(0)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Genuine Quality Guaranteed</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
