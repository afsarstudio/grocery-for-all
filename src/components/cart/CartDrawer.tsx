"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/lib/cartContext";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
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

  if (!isCartOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">My Grocery Basket</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {items.length} {items.length === 1 ? "item" : "items"} in cart
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          <div className="px-5 py-3 bg-brand-50/60 border-b border-brand-100/70">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                {amountForFreeDelivery === 0 ? (
                  <span className="text-emerald-700 font-bold">Yay! You get FREE Delivery</span>
                ) : (
                  <span>
                    Add <strong className="text-brand-700">₹{amountForFreeDelivery}</strong> more for{" "}
                    <strong>FREE Delivery</strong>
                  </span>
                )}
              </span>
              <span className="text-slate-500 text-[11px]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Fill your basket with fresh groceries, daily flours, edible oils, spices, and snacks from Grocery for All.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-brand-700 transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3.5 py-2">
                    <div className="relative w-16 h-16 rounded-xl bg-slate-50 overflow-hidden border border-slate-200 flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate mb-0.5">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-2 font-medium">{item.unit}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-slate-900">
                            ₹{item.price * item.quantity}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{item.mrp * item.quantity}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800 min-w-[18px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/80 p-5 space-y-4">
              {/* Coupon Section */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-700">{appliedCoupon.code}</span>
                        <p className="text-[11px] text-slate-500">{appliedCoupon.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Enter coupon (e.g. WELCOME100)"
                          className="w-full pl-8 pr-3 py-1.5 text-xs uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplying || !couponInput.trim()}
                        className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                      >
                        {isApplying ? "..." : "Apply"}
                      </button>
                    </form>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 mt-1.5 font-medium">{couponError}</p>
                    )}
                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
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
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Total (MRP)</span>
                  <span className="line-through text-slate-400">₹{mrpTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Store Discounted Price</span>
                  <span className="font-semibold text-slate-800">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Partner Fee</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
                {savings > 0 && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-center font-bold">
                    🎉 You are saving ₹{savings.toFixed(0)} on this order!
                  </div>
                )}
              </div>

              {/* Action */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-between px-5 active:scale-[0.99] transition-all"
              >
                <span>Proceed to Checkout</span>
                <div className="flex items-center gap-1.5">
                  <span>₹{total.toFixed(0)}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
