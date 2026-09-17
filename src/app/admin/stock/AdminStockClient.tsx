"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Boxes,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  RotateCcw,
  Loader2,
  Camera,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Product } from "@/types";
import { restockProduct } from "@/lib/actions";
import AIInventoryScannerModal from "@/components/admin/AIInventoryScannerModal";
import CustomizeRestockModal from "@/components/admin/CustomizeRestockModal";

interface AdminStockClientProps {
  initialProducts: Product[];
  initialLogs: any[];
  categories?: any[];
}

export default function AdminStockClient({
  initialProducts,
  initialLogs,
  categories = [],
}: AdminStockClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [filter, setFilter] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [search, setSearch] = useState("");
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [customizingProd, setCustomizingProd] = useState<Product | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 15).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const filtered = products.filter((p) => {
    if (filter === "LOW" && (p.stock > 15 || p.stock <= 0)) return false;
    if (filter === "OUT" && p.stock > 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleRestock = async (id: string, amount: number, productName: string) => {
    setRestockingId(id);
    try {
      const res = await restockProduct(id, amount, `Manual Admin Restock (+${amount} units)`);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stock: res.product!.stock } : p))
        );
        setLogs((prev) => [
          {
            id: String(Date.now()),
            productId: id,
            productName,
            changeAmount: amount,
            type: "RESTOCK",
            reason: `Manual Restock (+${amount})`,
            createdAt: new Date(),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error("Restock failed:", err);
    } finally {
      setRestockingId(null);
    }
  };

  const handleCustomRestockSuccess = (
    updatedProduct: Product,
    changeAmount: number,
    reason: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? { ...p, stock: updatedProduct.stock } : p))
    );
    setLogs((prev) => [
      {
        id: String(Date.now()),
        productId: updatedProduct.id,
        productName: updatedProduct.name,
        changeAmount,
        type: changeAmount >= 0 ? "RESTOCK" : "CORRECTION",
        reason,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  };

  const handleAIInventoryUpdated = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Supermarket Stocking</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Inventory &amp; Stock Management
          </h1>
          <p className="text-xs text-slate-400">
            Monitor real-time shelves or click a photo of grocery crates to auto-stock via AI
          </p>
        </div>

        <button
          onClick={() => setIsAIModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-black text-xs rounded-2xl shadow-lg shadow-brand-900/40 flex items-center gap-2 hover:scale-[1.02] transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>AI Image Scanner / Inventory</span>
        </button>
      </div>

      {/* AI Scanner Modal */}
      <AIInventoryScannerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onInventoryUpdated={handleAIInventoryUpdated}
        categories={categories}
        allProducts={products}
      />

      {/* Stock Health Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "ALL"
              ? "bg-slate-900 border-brand-500 shadow-md ring-1 ring-brand-500/50"
              : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            All Supermarket Items
          </div>
          <div className="text-2xl font-black text-white mt-1">{products.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total products cataloged</div>
        </button>

        <button
          onClick={() => setFilter("LOW")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "LOW"
              ? "bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500/50"
              : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Items (≤15)</span>
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{lowStockCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Order from warehouse supplier</div>
        </button>

        <button
          onClick={() => setFilter("OUT")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filter === "OUT"
              ? "bg-rose-950/50 border-rose-500 shadow-md ring-1 ring-rose-500/50"
              : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Out of Stock</span>
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1">{outOfStockCount}</div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">Customer ordering disabled</div>
        </button>
      </div>

      {/* Main Stock Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-card">
        {/* Search */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items to restock..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing {filtered.length} products
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Item</th>
                <th className="px-4 py-3.5">Unit</th>
                <th className="px-4 py-3.5">Current Stock</th>
                <th className="px-4 py-3.5">Stock Status</th>
                <th className="px-4 py-3.5 text-right">Quick Restock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((prod) => {
                const isRestocking = restockingId === prod.id;

                return (
                  <tr key={prod.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 flex-shrink-0">
                          <Image
                            src={prod.imageUrl}
                            alt={prod.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white truncate max-w-[200px]">
                            {prod.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{prod.brand || "GFA"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400">{prod.unit}</td>

                    <td className="px-4 py-3.5 font-bold text-white text-sm">
                      {prod.stock} units
                    </td>

                    <td className="px-4 py-3.5">
                      {prod.stock <= 0 ? (
                        <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Out of Stock
                        </span>
                      ) : prod.stock <= 15 ? (
                        <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Low Stock Warning
                        </span>
                      ) : (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Healthy
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isRestocking ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestock(prod.id, 25, prod.name)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-brand-600 hover:text-white text-slate-300 rounded-lg text-[11px] font-bold border border-slate-800 transition-colors"
                            >
                              +25
                            </button>
                            <button
                              onClick={() => handleRestock(prod.id, 50, prod.name)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-brand-600 hover:text-white text-slate-300 rounded-lg text-[11px] font-bold border border-slate-800 transition-colors"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => handleRestock(prod.id, 100, prod.name)}
                              className="px-2.5 py-1 bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white rounded-lg text-[11px] font-bold border border-brand-500/40 transition-colors"
                            >
                              +100
                            </button>
                            <button
                              onClick={() => setCustomizingProd(prod)}
                              className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 hover:text-white rounded-lg text-[11px] font-bold border border-teal-500/40 transition-all flex items-center gap-1 cursor-pointer"
                              title="Customize replenishment & exact stock audit"
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Logs Section */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-brand-400" />
          <span>Warehouse Replenishment Activity Logs</span>
        </h2>

        <div className="divide-y divide-slate-800/80 text-xs">
          {logs.slice(0, 8).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">{log.productName}</span>
                <span className="text-slate-500 block text-[11px]">
                  {log.reason || "Inventory Adjustment"}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-400">+{log.changeAmount} units</span>
                <span className="text-[10px] text-slate-500 block">
                  {new Date(log.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customize Restock Modal */}
      <CustomizeRestockModal
        isOpen={Boolean(customizingProd)}
        product={customizingProd}
        onClose={() => setCustomizingProd(null)}
        onRestockSuccess={handleCustomRestockSuccess}
      />
    </div>
  );
}
