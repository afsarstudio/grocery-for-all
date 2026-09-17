"use client";

import React, { useState, useEffect, useId } from "react";
import Image from "next/image";
import {
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  Check,
  Loader2,
  AlertTriangle,
  Boxes,
  Truck,
  Building2,
  ShoppingCart,
  ClipboardCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Product } from "@/types";
import { restockProduct, setProductExactStock } from "@/lib/actions";

interface CustomizeRestockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onRestockSuccess: (updatedProduct: Product, changeAmount: number, reason: string) => void;
}

const REASON_PRESETS = [
  { id: "warehouse", label: "Warehouse Replenish", icon: Building2, desc: "Stock from central depot" },
  { id: "mandi", label: "Mandi Fresh Arrival", icon: ShoppingCart, desc: "Local wholesale mandi" },
  { id: "distributor", label: "Distributor Delivery", icon: Truck, desc: "Direct brand distributor" },
  { id: "audit", label: "Physical Audit Correction", icon: ClipboardCheck, desc: "Store count reconciliation" },
  { id: "return", label: "Customer / Shelf Return", icon: RotateCcw, desc: "Returned undamaged items" },
  { id: "custom", label: "Custom Note...", icon: SlidersHorizontal, desc: "Custom reason" },
];

const QUICK_ADD_PRESETS = [5, 10, 20, 25, 50, 100, 250];
const QUICK_SET_PRESETS = [0, 10, 25, 50, 100, 200];

export default function CustomizeRestockModal({
  product,
  isOpen,
  onClose,
  onRestockSuccess,
}: CustomizeRestockModalProps) {
  const [mode, setMode] = useState<"ADD" | "SET">("ADD");
  const [addQty, setAddQty] = useState<number>(25);
  const [exactQty, setExactQty] = useState<number>(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("warehouse");
  const [customReasonText, setCustomReasonText] = useState<string>("");
  const [supplierNote, setSupplierNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when opened with product
  useEffect(() => {
    if (product && isOpen) {
      setMode("ADD");
      // Default restock suggestion: if stock <= 0 suggest 50, else 25
      setAddQty(product.stock <= 0 ? 50 : 25);
      setExactQty(product.stock);
      setSelectedPresetId("warehouse");
      setCustomReasonText("");
      setSupplierNote("");
      setErrorMsg(null);
    }
  }, [product, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const isOut = currentStock <= 0;
  const isLow = currentStock > 0 && currentStock <= 15;

  // Calculate new projected total stock
  const projectedStock = mode === "ADD" ? Math.max(0, currentStock + (addQty || 0)) : Math.max(0, exactQty || 0);
  const changeAmount = projectedStock - currentStock;
  const estimatedStockValue = Math.max(0, changeAmount) * product.price;

  // Build finalized reason string
  const getFinalReason = () => {
    let baseReason = "";
    if (selectedPresetId === "custom" || !selectedPresetId) {
      baseReason = customReasonText.trim() || "Custom Stock Adjustment";
    } else {
      const preset = REASON_PRESETS.find((p) => p.id === selectedPresetId);
      baseReason = preset ? preset.label : "Manual Restock";
    }

    if (supplierNote.trim()) {
      baseReason += ` (${supplierNote.trim()})`;
    }
    return baseReason;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (mode === "ADD" && (isNaN(addQty) || addQty <= 0)) {
      setErrorMsg("Please enter a valid quantity greater than 0.");
      return;
    }

    if (mode === "SET" && (isNaN(exactQty) || exactQty < 0)) {
      setErrorMsg("Please enter a valid stock number (0 or higher).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const reason = getFinalReason();

    try {
      if (mode === "ADD") {
        const res = await restockProduct(product.id, addQty, reason);
        if (res.success && res.product) {
          onRestockSuccess(res.product as Product, addQty, reason);
          onClose();
        } else {
          setErrorMsg(res.error || "Failed to restock product.");
        }
      } else {
        const res = await setProductExactStock(product.id, exactQty, reason);
        if (res.success && res.product) {
          onRestockSuccess(res.product as Product, changeAmount, reason);
          onClose();
        } else {
          setErrorMsg(res.error || "Failed to adjust exact stock.");
        }
      }
    } catch (err: any) {
      console.error("Customize restock error:", err);
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base leading-snug">
                Customize Inventory Restock
              </h3>
              <p className="text-[11px] text-slate-400">
                Custom quantity, exact counts &amp; supplier batch logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Product Summary Card */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800/90 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative flex-shrink-0">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-white text-sm truncate">
                {product.name}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{product.unit}</span>
                <span>•</span>
                <span className="text-teal-400 font-bold">₹{product.price}</span>
                {product.mrp > product.price && (
                  <span className="text-[10px] text-slate-500 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-slate-400">Current Shelf:</span>
                <span
                  className={`inline-flex items-center font-bold text-[11px] px-2 py-0.5 rounded-lg border ${
                    isOut
                      ? "bg-rose-950/80 text-rose-300 border-rose-800"
                      : isLow
                      ? "bg-amber-950/80 text-amber-300 border-amber-800"
                      : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  }`}
                >
                  {currentStock} units {isOut ? "(Out of Stock)" : isLow ? "(Low Stock)" : "(Healthy)"}
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode("ADD")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "ADD"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Units (+ Replenish)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("SET");
                setExactQty(currentStock);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "SET"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Set Exact Count (= Audit)</span>
            </button>
          </div>

          {/* Quantity Controls */}
          {mode === "ADD" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Quantity to Add ({product.unit})
                </label>
                <span className="text-[11px] text-teal-400 font-semibold">
                  Adds to current {currentStock} units
                </span>
              </div>

              {/* Number Input with +/- step buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddQty((q) => Math.max(1, (q || 0) - 5))}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center text-base font-black transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setAddQty((q) => Math.max(1, (q || 0) - 1))}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={addQty === 0 ? "" : addQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAddQty(isNaN(val) ? 0 : val);
                    }}
                    placeholder="Enter units..."
                    className="w-full h-11 px-4 bg-slate-950 border border-teal-500/50 rounded-xl text-center text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold pointer-events-none">
                    units
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddQty((q) => (q || 0) + 1)}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAddQty((q) => (q || 0) + 5)}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center text-base font-black transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  +5
                </button>
              </div>

              {/* Fast Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">
                  Presets:
                </span>
                {QUICK_ADD_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAddQty(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      addQty === preset
                        ? "bg-teal-500 text-slate-950 font-black scale-105"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Set Exact Physical Stock Count
                </label>
                <span className="text-[11px] text-amber-400 font-semibold">
                  Physical count audit
                </span>
              </div>

              {/* Exact Stock Input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExactQty((q) => Math.max(0, (q || 0) - 5))}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center text-base font-black transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setExactQty((q) => Math.max(0, (q || 0) - 1))}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={exactQty === 0 && currentStock !== 0 ? 0 : exactQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setExactQty(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    placeholder="Enter total units..."
                    className="w-full h-11 px-4 bg-slate-950 border border-amber-500/50 rounded-xl text-center text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold pointer-events-none">
                    units total
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExactQty((q) => (q || 0) + 1)}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setExactQty((q) => (q || 0) + 5)}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center text-base font-black transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                >
                  +5
                </button>
              </div>

              {/* Fast Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">
                  Set To:
                </span>
                {QUICK_SET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setExactQty(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      exactQty === preset
                        ? "bg-amber-500 text-slate-950 font-black scale-105"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    ={preset} {preset === 0 ? "(Empty)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Calculation & Projection Card */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Stock Calculation:</span>
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="text-slate-400">{currentStock}</span>
                <span className="text-teal-400">{changeAmount >= 0 ? `+${changeAmount}` : `${changeAmount}`}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-emerald-400 text-sm font-black underline decoration-emerald-500/40 underline-offset-4">
                  {projectedStock} units
                </span>
              </div>
            </div>
            {changeAmount > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Added Stock Retail Value:</span>
                <span className="font-bold text-teal-300">
                  ₹{estimatedStockValue.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          {/* Restock Reason & Source Tagging */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Restock Source &amp; Audit Reason
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REASON_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-teal-950/70 border-teal-500 text-white shadow-sm ring-1 ring-teal-500/40"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-teal-400" : "text-slate-500"}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold leading-tight truncate">
                        {preset.label}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">
                        {preset.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Reason Text if selected */}
            {selectedPresetId === "custom" && (
              <input
                type="text"
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="Type custom restock reason..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            )}

            {/* Optional Supplier / Batch Note */}
            <div>
              <input
                type="text"
                value={supplierNote}
                onChange={(e) => setSupplierNote(e.target.value)}
                placeholder="Optional: Supplier name, Invoice #, or Mandi Crate Batch..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-teal-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Inventory...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>
                  Confirm &amp; Set to {projectedStock} Units ({changeAmount >= 0 ? `+${changeAmount}` : `${changeAmount}`})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
