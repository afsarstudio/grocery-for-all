"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Boxes,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  Package,
  TrendingUp,
  Tag,
  Edit3,
  Check,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Product, Category } from "@/types";
import { restockProduct, getProducts, getCategories, updateProductPrice } from "@/lib/actions";
import CustomizeRestockModal from "@/components/admin/CustomizeRestockModal";

interface ManagerInventoryClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function ManagerInventoryClient({
  initialProducts,
  categories,
}: ManagerInventoryClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "OUT" | "HEALTHY">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingPriceProd, setEditingPriceProd] = useState<Product | null>(null);
  const [customizingRestockProd, setCustomizingRestockProd] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editMrp, setEditMrp] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const fetchLatestProducts = async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const fresh = await getProducts({ inStockOnly: false } as any);
      if (fresh) setProducts(fresh as any);
    } catch (err) {
      console.error("Inventory sync error:", err);
    } finally {
      if (showSpin) setIsRefreshing(false);
    }
  };

  const handleOpenEditPrice = (prod: Product) => {
    setEditingPriceProd(prod);
    setEditPrice(prod.price.toString());
    setEditMrp(prod.mrp.toString());
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceProd) return;
    const p = parseFloat(editPrice);
    const m = parseFloat(editMrp) || p;
    if (isNaN(p) || p < 0) return;

    setIsSavingPrice(true);
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) =>
        item.id === editingPriceProd.id ? { ...item, price: p, mrp: m } : item
      )
    );

    try {
      await updateProductPrice(editingPriceProd.id, p, m);
      setEditingPriceProd(null);
    } catch (err) {
      console.error("Failed to update price:", err);
      fetchLatestProducts(false);
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleRestock = async (productId: string, amount: number) => {
    setUpdatingId(productId);
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + amount } : p))
    );

    try {
      const res = await restockProduct(productId, amount, `Manager Restock (+${amount})`);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? (res.product as any) : p))
        );
      }
    } catch (err) {
      console.error("Restock failed:", err);
      // Rollback on failure
      fetchLatestProducts(false);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenCustomizeRestock = (prod: Product) => {
    setCustomizingRestockProd(prod);
  };

  const handleCustomRestockSuccess = (
    updatedProduct: Product,
    changeAmount: number,
    reason: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? (updatedProduct as any) : p))
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "ALL" && p.categoryId !== selectedCategory) return false;
      if (stockFilter === "LOW" && (p.stock <= 0 || p.stock > 15)) return false;
      if (stockFilter === "OUT" && p.stock > 0) return false;
      if (stockFilter === "HEALTHY" && p.stock <= 15) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedCategory, stockFilter, search]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= 15).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock <= 0).length,
    [products]
  );
  const totalStockUnits = useMemo(
    () => products.reduce((s, p) => s + p.stock, 0),
    [products]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Boxes className="w-3.5 h-3.5" />
              <span>Store Inventory &amp; Replenish</span>
            </span>
            <span className="text-xs text-slate-400">
              {products.length} active products
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Inventory &amp; Quick Restock Desk
          </h1>
          <p className="text-xs text-slate-400">
            Monitor real-time shelf stock and add replenishment units in 1-click
          </p>
        </div>

        <button
          onClick={() => fetchLatestProducts(true)}
          disabled={isRefreshing}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
          <span>Sync Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Total Grocery Stock
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {totalStockUnits.toLocaleString("en-IN")} units
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Low Stock Warnings
            </span>
            <div className="text-2xl font-black text-amber-400 mt-0.5">
              {lowStockCount} items
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Out of Stock
            </span>
            <div className="text-2xl font-black text-rose-400 mt-0.5">
              {outOfStockCount} items
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setStockFilter("ALL")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              stockFilter === "ALL"
                ? "bg-teal-600 text-white shadow font-extrabold"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setStockFilter("LOW")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              stockFilter === "LOW"
                ? "bg-amber-600 text-white shadow font-extrabold"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockFilter("OUT")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              stockFilter === "OUT"
                ? "bg-rose-600 text-white shadow font-extrabold"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter products by category"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or brand..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price / MRP</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4 text-right">Quick &amp; Custom Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod: Product) => {
                  const isUpdating = updatingId === prod.id;
                  const isLow = prod.stock > 0 && prod.stock <= 15;
                  const isOut = prod.stock <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-900/60 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative flex-shrink-0">
                            <Image
                              src={prod.imageUrl}
                              alt={prod.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {prod.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {prod.unit} • {prod.brand || "Grocery for All"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium">
                          {prod.category?.name || "Grocery"}
                        </span>
                      </td>

                      {/* Price & Quick Price Edit */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-teal-300">
                              ₹{prod.price}
                            </div>
                            {prod.mrp > prod.price && (
                              <div className="text-[10px] text-slate-500 line-through">
                                MRP ₹{prod.mrp}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenEditPrice(prod)}
                            className="p-1 text-slate-500 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Edit Price & MRP"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center font-black text-xs px-2.5 py-1 rounded-xl border ${
                              isOut
                                ? "bg-rose-950 text-rose-300 border-rose-800"
                                : isLow
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : "bg-emerald-950 text-emerald-300 border-emerald-800"
                            }`}
                          >
                            {prod.stock} units
                          </span>
                          {isOut && (
                            <span className="text-[10px] text-rose-400 font-bold uppercase">
                              Out of stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick & Custom Restock Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isUpdating ? (
                            <div className="px-4 py-1.5 text-xs text-teal-400 flex items-center gap-1 font-bold">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestock(prod.id, 10)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-teal-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer active:scale-95"
                                title="Add 10 units"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleRestock(prod.id, 25)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-teal-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer active:scale-95"
                                title="Add 25 units"
                              >
                                +25
                              </button>
                              <button
                                onClick={() => handleRestock(prod.id, 50)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow transition-all cursor-pointer active:scale-95"
                                title="Add 50 units"
                              >
                                +50
                              </button>
                              <button
                                onClick={() => handleOpenCustomizeRestock(prod)}
                                className="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 hover:text-white font-bold text-xs rounded-lg border border-teal-500/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                                title="Customize restock quantity, exact count & audit notes"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>Custom</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Price / MRP Edit Modal */}
      {editingPriceProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-400" />
                <span>Quick Price Adjustment</span>
              </h3>
              <button
                onClick={() => setEditingPriceProd(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="font-bold text-xs text-white truncate">
                {editingPriceProd.name}
              </div>
              <div className="text-[11px] text-slate-400">
                {editingPriceProd.unit} • Current Price: ₹{editingPriceProd.price}
              </div>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-black text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    required
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-black text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPriceProd(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrice}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5"
                >
                  {isSavingPrice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Update Price</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customize Restock Modal */}
      <CustomizeRestockModal
        isOpen={Boolean(customizingRestockProd)}
        product={customizingRestockProd}
        onClose={() => setCustomizingRestockProd(null)}
        onRestockSuccess={handleCustomRestockSuccess}
      />
    </div>
  );
}
