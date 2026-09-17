"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/lib/cartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const cartItem = items.find((item) => item.id === product.id);
  const inCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;

  const discountPercent =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-brand-300 hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        {discountPercent > 0 ? (
          <span className="bg-gradient-to-r from-brand-600 to-brand-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
            {discountPercent}% OFF
          </span>
        ) : product.badge ? (
          <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {product.badge}
          </span>
        ) : <span />}

        {product.isVegetarian && (
          <span
            title="100% Vegetarian"
            className="flex items-center justify-center w-5 h-5 rounded-md border border-emerald-600 bg-white shadow-sm"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block w-full pt-[75%] bg-slate-50 overflow-hidden cursor-pointer"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        {/* Brand & Unit */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium truncate max-w-[120px]">{product.brand || "Grocery for All"}</span>
          <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
            {product.unit}
          </span>
        </div>

        {/* Product Title */}
        <Link
          href={`/products/${product.slug}`}
          className="font-semibold text-sm sm:text-base text-slate-800 line-clamp-2 hover:text-brand-600 transition-colors mb-2 group-hover:underline decoration-brand-400"
        >
          {product.name}
        </Link>

        {/* Stock status notice */}
        {isLowStock && (
          <div className="text-[11px] text-amber-600 font-medium mb-1">
            Only {product.stock} left in store!
          </div>
        )}

        {/* Price & Action button row */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.mrp}
                </span>
              )}
            </div>
            {product.mrp > product.price && (
              <span className="text-[10px] font-semibold text-emerald-700">
                Save ₹{product.mrp - product.price}
              </span>
            )}
          </div>

          {/* Cart Actions */}
          {isOutOfStock ? (
            <button
              disabled
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : inCart ? (
            <div className="flex items-center bg-brand-600 text-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="p-1.5 sm:p-2 hover:bg-brand-700 active:scale-95 transition-all"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-xs sm:text-sm min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => {
                  if (quantity < product.stock) {
                    updateQuantity(product.id, quantity + 1);
                  }
                }}
                disabled={quantity >= product.stock}
                className="p-1.5 sm:p-2 hover:bg-brand-700 disabled:opacity-50 active:scale-95 transition-all"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(product, 1)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-brand-600 bg-brand-50 border border-brand-200 hover:bg-brand-600 hover:text-white rounded-xl active:scale-95 transition-all duration-200 shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
