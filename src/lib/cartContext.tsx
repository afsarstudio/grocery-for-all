"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Product, Coupon } from "@/types";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: Coupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  deliveryFee: number;
  discount: number;
  total: number;
  freeDeliveryThreshold: number;
  amountForFreeDelivery: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_DELIVERY_THRESHOLD = 499;
const STANDARD_DELIVERY_FEE = 40;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("gfa_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .filter((i) => i && i.id && typeof i.price === "number")
            .map((i) => ({
              ...i,
              quantity: Math.max(1, typeof i.quantity === "number" && !isNaN(i.quantity) ? i.quantity : 1),
              stock: typeof i.stock === "number" && !isNaN(i.stock) && i.stock > 0 ? i.stock : 50,
            }));
          setItems(sanitized);
        }
      }
      const savedCoupon = localStorage.getItem("gfa_coupon");
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("gfa_cart", JSON.stringify(items));
      if (appliedCoupon) {
        localStorage.setItem("gfa_coupon", JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem("gfa_coupon");
      }
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [items, appliedCoupon, isInitialized]);

  const addItem = (product: Product, quantity = 1) => {
    if (!product || !product.id) return;

    const cleanStock =
      typeof product.stock === "number" && !isNaN(product.stock) && product.stock > 0
        ? product.stock
        : 50;
    const addQty = Math.max(1, typeof quantity === "number" && !isNaN(quantity) ? quantity : 1);

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => {
          if (item.id === product.id) {
            const maxStock = item.stock || cleanStock;
            return {
              ...item,
              quantity: Math.max(1, Math.min(item.quantity + addQty, maxStock)),
            };
          }
          return item;
        });
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price) || 0,
          mrp: Number(product.mrp) || Number(product.price) || 0,
          imageUrl: product.imageUrl || "/images/products/maggi_noodles.svg",
          unit: product.unit || "1 unit",
          quantity: Math.max(1, Math.min(addQty, cleanStock)),
          stock: cleanStock,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const numQty = typeof quantity === "number" && !isNaN(quantity) ? quantity : 0;
    if (numQty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, Math.min(numQty, item.stock || 50)) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const mrpTotal = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || items.length === 0 ? 0 : STANDARD_DELIVERY_FEE;
  const amountForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  // Discount calculation
  let discount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrderAmount) {
    const rawDiscount = (subtotal * appliedCoupon.discountPercent) / 100;
    discount = Math.min(rawDiscount, appliedCoupon.maxDiscount);
  }

  const savings = Math.max(0, mrpTotal - subtotal) + discount;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    const trimmed = code.trim().toUpperCase();

    // Built-in checks or server validation
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(trimmed)}&subtotal=${subtotal}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.message || "Invalid coupon code");
        return false;
      }

      setAppliedCoupon(data.coupon);
      return true;
    } catch {
      // Fallback local validate
      if (trimmed === "WELCOME100") {
        if (subtotal < 499) {
          setCouponError("Minimum order value for WELCOME100 is ₹499");
          return false;
        }
        setAppliedCoupon({
          id: "welcome100",
          code: "WELCOME100",
          discountPercent: 15,
          minOrderAmount: 499,
          maxDiscount: 100,
          description: "15% OFF up to ₹100",
          isActive: true,
        });
        return true;
      } else if (trimmed === "SUPERKIRANA") {
        if (subtotal < 999) {
          setCouponError("Minimum order value for SUPERKIRANA is ₹999");
          return false;
        }
        setAppliedCoupon({
          id: "superkirana",
          code: "SUPERKIRANA",
          discountPercent: 20,
          minOrderAmount: 999,
          maxDiscount: 250,
          description: "20% OFF up to ₹250",
          isActive: true,
        });
        return true;
      } else if (trimmed === "FREESHIP") {
        setAppliedCoupon({
          id: "freeship",
          code: "FREESHIP",
          discountPercent: 10,
          minOrderAmount: 299,
          maxDiscount: 50,
          description: "Flat ₹50 savings",
          isActive: true,
        });
        return true;
      }
      setCouponError("Invalid coupon code");
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        itemCount,
        subtotal,
        mrpTotal,
        savings,
        deliveryFee,
        discount,
        total,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        amountForFreeDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
