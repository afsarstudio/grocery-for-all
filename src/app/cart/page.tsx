"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useCart } from "@/lib/cartContext";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    mrpTotal,
    savings,
    deliveryFee,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    amountForFreeDelivery,
    freeDeliveryThreshold,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    await applyCoupon(couponInput);
    setIsApplying(false);
  };

  const progressPercent = Math.min(
    100,
    Math.round(((freeDeliveryThreshold - amountForFreeDelivery) / freeDeliveryThreshold) * 100)
  );

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="max-w-md mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Your Basket is Empty</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Looks like you haven&apos;t added any groceries to your cart yet. Explore our fresh supermarket aisles!
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shopping Basket
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review your {items.length} grocery items before checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Basket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Delivery Banner */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-600" />
                {amountForFreeDelivery === 0 ? (
                  <span className="text-emerald-700 font-bold">
                    You have unlocked FREE Supermarket Delivery!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-brand-700">₹{amountForFreeDelivery}</strong> more
                    for FREE Delivery
                  </span>
                )}
              </span>
              <span className="text-slate-500 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-brand-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden border border-slate-200 flex-shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-bold text-sm sm:text-base text-slate-900 hover:text-brand-600 line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Unit: {item.unit}</p>
                    <div className="flex items-baseline gap-2 mt-1 sm:hidden">
                      <span className="font-bold text-sm text-slate-900">
                        ₹{item.price * item.quantity}
                      </span>
                      {item.mrp > item.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{item.mrp * item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Quantity */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs sm:text-sm font-bold text-slate-800 min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                      aria-label="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="hidden sm:block text-right min-w-[90px]">
                    <div className="font-black text-base text-slate-900">
                      ₹{item.price * item.quantity}
                    </div>
                    {item.mrp > item.price && (
                      <div className="text-xs text-slate-400 line-through">
                        ₹{item.mrp * item.quantity}
                      </div>
                    )}
                  </div>

                  {/* Remove Item */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupons Box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-600" />
              <span>Supermarket Coupon</span>
            </h3>

            {appliedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-800">{appliedCoupon.code}</span>
                    <p className="text-[11px] text-emerald-700">{appliedCoupon.description}</p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code (WELCOME100)"
                    className="flex-1 px-3 py-2 text-xs uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={isApplying || !couponInput.trim()}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {isApplying ? "..." : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["WELCOME100", "SUPERKIRANA", "FREESHIP"].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setCouponInput(code);
                        applyCoupon(code);
                      }}
                      className="text-[10px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-0.5 rounded-md transition-colors"
                    >
                      +{code}
                    </button>
                  ))}
                </div>
              </form>
            )}
          </div>

          {/* Bill Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Bill Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Total MRP</span>
                <span className="line-through text-slate-400">₹{mrpTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Supermarket Price</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Savings</span>
                  <span>-₹{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee (Tetari Bazar)</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                <span>To Pay</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {savings > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-center text-xs font-bold">
                🎉 Total Savings on this order: ₹{savings.toFixed(0)}
              </div>
            )}

            <Link
              href="/checkout"
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-between px-6 active:scale-[0.99] transition-all"
            >
              <span>Proceed to Checkout</span>
              <div className="flex items-center gap-2">
                <span>₹{total.toFixed(0)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
