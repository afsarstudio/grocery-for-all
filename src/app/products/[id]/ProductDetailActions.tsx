"use client";

import React, { useState } from "react";
import { Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/lib/cartContext";

interface ProductDetailActionsProps {
  product: Product;
}

export default function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const { items, addItem, updateQuantity, setIsCartOpen } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);

  const cartItem = items.find((item) => item.id === product.id);
  const inCart = !!cartItem;
  const currentCartQty = cartItem?.quantity || 0;

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    addItem(product, selectedQty);
  };

  return (
    <div className="pt-4 border-t border-slate-100 space-y-4">
      {/* Stock Health indicator */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Availability:</span>
        {isOutOfStock ? (
          <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
            Out of Stock
          </span>
        ) : product.stock <= 10 ? (
          <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
            Limited Stock ({product.stock} left)
          </span>
        ) : (
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            In Stock ({product.stock} available)
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!inCart ? (
          <>
            {/* Quantity Picker */}
            <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-2xl px-3 py-2 sm:w-36">
              <button
                type="button"
                onClick={() => setSelectedQty((prev) => Math.max(1, prev - 1))}
                disabled={selectedQty <= 1 || isOutOfStock}
                className="p-1 hover:bg-white rounded-lg text-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Decrease"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-slate-900">{selectedQty}</span>
              <button
                type="button"
                onClick={() => setSelectedQty((prev) => Math.min(product.stock, prev + 1))}
                disabled={selectedQty >= product.stock || isOutOfStock}
                className="p-1 hover:bg-white rounded-lg text-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Increase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Basket Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-glow active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Basket (₹{product.price * selectedQty})</span>
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-between bg-brand-50 border border-brand-200 p-2.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-brand-600 text-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => updateQuantity(product.id, currentCartQty - 1)}
                  className="p-2 hover:bg-brand-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-bold text-sm min-w-[24px] text-center">
                  {currentCartQty}
                </span>
                <button
                  onClick={() => updateQuantity(product.id, currentCartQty + 1)}
                  disabled={currentCartQty >= product.stock}
                  className="p-2 hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs font-bold text-brand-900">Added in Basket</span>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 shadow-sm transition-colors"
            >
              View Basket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
