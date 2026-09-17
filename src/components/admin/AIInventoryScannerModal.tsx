"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Boxes,
  Plus,
  Minus,
  RefreshCw,
  Zap,
  ArrowRight,
  Video,
  VideoOff,
  SwitchCamera,
  AlertCircle,
  PackageCheck,
  Layers,
  ChevronRight,
} from "lucide-react";
import { restockProduct, bulkRestockProducts, createProduct } from "@/lib/actions";
import confetti from "canvas-confetti";
import { Product } from "@/types";

interface AIInventoryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryUpdated: () => void;
  categories: any[];
  allProducts?: Product[];
}

interface DetectedItemState {
  name: string;
  brand?: string | null;
  category?: string | null;
  unit: string;
  price: number;
  mrp: number;
  quantity: number;
  confidence: number;
  description?: string;
  matchedProductId?: string;
  matchedProduct?: any;
  stockBefore: number;
  newStock: number;
  isCustomNew?: boolean;
}

export default function AIInventoryScannerModal({
  isOpen,
  onClose,
  onInventoryUpdated,
  categories,
  allProducts = [],
}: AIInventoryScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "presets">("camera");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItemState[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aiEngineUsed, setAiEngineUsed] = useState<string>("");

  // Camera stream states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera stream
  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera permissions in your browser or use the file upload option."
          : "Could not access live camera. Please use File Upload or Presets below."
      );
      setIsCameraActive(false);
    }
  }, [facingMode, stopCameraStream]);

  // Handle modal open/close camera lifecycle
  useEffect(() => {
    if (isOpen && activeTab === "camera" && !imagePreview) {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, imagePreview, startCameraStream, stopCameraStream]);

  if (!isOpen) return null;

  // Capture current frame from live camera video
  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    stopCameraStream();
    setImageName(`camera_capture_${Date.now()}.jpg`);
    setImagePreview(dataUrl);
    analyzeImage(dataUrl, "Live Camera Photo", undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCameraStream();
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      analyzeImage(result, file.name, undefined);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetKey: string, presetName: string, presetImg: string) => {
    stopCameraStream();
    setImageName(presetName);
    setImagePreview(presetImg);
    analyzeImage(presetImg, presetName, presetKey);
  };

  const analyzeImage = async (imgData: string, name: string, preset?: string) => {
    setIsAnalyzing(true);
    setScanResult(null);
    setDetectedItems([]);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/scan-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imgData,
          imageName: name,
          samplePreset: preset,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setScanResult(data);
        setAiEngineUsed(data.aiEngine || "AI Vision Engine");

        if (Array.isArray(data.items) && data.items.length > 0) {
          setDetectedItems(
            data.items.map((it: any) => ({
              ...it,
              quantity: it.quantity || it.suggestedRestock || 25,
              stockBefore: it.stockBefore || (it.matchedProduct ? it.matchedProduct.stock : 0),
              newStock:
                (it.stockBefore || (it.matchedProduct ? it.matchedProduct.stock : 0)) +
                (it.quantity || 25),
            }))
          );
        } else if (data.detectedDetails) {
          const det = data.detectedDetails;
          setDetectedItems([
            {
              name: det.name,
              brand: det.brand,
              category: det.category,
              unit: det.unit,
              price: det.price,
              mrp: det.mrp,
              quantity: det.suggestedRestock || 25,
              confidence: parseInt(det.confidence) || 95,
              description: det.description,
              matchedProductId: data.matchedProduct?.id,
              matchedProduct: data.matchedProduct,
              stockBefore: det.stockBefore || 0,
              newStock: (det.stockBefore || 0) + (det.suggestedRestock || 25),
            },
          ]);
        }
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleItemQuantityChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setDetectedItems((prev) =>
      prev.map((it, i) => {
        if (i === index) {
          return {
            ...it,
            quantity: qty,
            newStock: it.stockBefore + qty,
          };
        }
        return it;
      })
    );
  };

  const handleItemMatchProductChange = (index: number, productId: string) => {
    const matched = allProducts.find((p) => p.id === productId);
    setDetectedItems((prev) =>
      prev.map((it, i) => {
        if (i === index) {
          if (productId === "NEW_ITEM") {
            return {
              ...it,
              matchedProductId: undefined,
              matchedProduct: null,
              isCustomNew: true,
              stockBefore: 0,
              newStock: it.quantity,
            };
          }
          return {
            ...it,
            matchedProductId: matched?.id,
            matchedProduct: matched || null,
            isCustomNew: false,
            name: matched ? matched.name : it.name,
            brand: matched ? matched.brand : it.brand,
            unit: matched ? matched.unit : it.unit,
            stockBefore: matched ? matched.stock : 0,
            newStock: (matched ? matched.stock : 0) + it.quantity,
          };
        }
        return it;
      })
    );
  };

  const handleApplyUpdate = async () => {
    if (detectedItems.length === 0) return;
    setIsApplying(true);

    try {
      let restockedCount = 0;
      let totalUnitsAdded = 0;

      const matchedToRestock = detectedItems.filter(
        (it) => it.matchedProductId && !it.isCustomNew
      );
      const newItemsToCreate = detectedItems.filter(
        (it) => !it.matchedProductId || it.isCustomNew
      );

      // 1. Bulk Restock matched items
      if (matchedToRestock.length > 0) {
        if (matchedToRestock.length === 1) {
          const item = matchedToRestock[0];
          await restockProduct(
            item.matchedProductId!,
            item.quantity,
            `AI Camera Visual Restock (+${item.quantity} units)`
          );
          restockedCount += 1;
          totalUnitsAdded += item.quantity;
        } else {
          const res = await bulkRestockProducts(
            matchedToRestock.map((it) => ({
              productId: it.matchedProductId!,
              quantityToAdd: it.quantity,
              reason: `AI Camera Batch Restock: ${it.name} (+${it.quantity})`,
            }))
          );
          if (res.success) {
            restockedCount += matchedToRestock.length;
            totalUnitsAdded += matchedToRestock.reduce((sum, it) => sum + it.quantity, 0);
          }
        }
      }

      // 2. Create new detected items
      for (const item of newItemsToCreate) {
        const cat =
          categories.find(
            (c) => c.name.toLowerCase() === (item.category || "").toLowerCase()
          ) || categories[0];

        const res = await createProduct({
          name: item.name,
          brand: item.brand || "Supermarket Item",
          price: item.price || 100,
          mrp: item.mrp || 120,
          stock: item.quantity,
          unit: item.unit || "1 unit",
          imageUrl:
            item.matchedProduct?.imageUrl ||
            "/images/products/pohsan_maida.jpg",
          isFeatured: false,
          isVegetarian: true,
          categoryId: cat?.id || "",
          description: item.description || `AI Visual Scanned Product (${item.unit})`,
        });

        if (res.success) {
          restockedCount += 1;
          totalUnitsAdded += item.quantity;
        }
      }

      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setSuccessMessage(
        `AI Inventory Update Successful! Restocked ${totalUnitsAdded} units across ${restockedCount} product(s).`
      );

      setTimeout(() => {
        onInventoryUpdated();
      }, 1200);
    } catch (err) {
      console.error("Failed to apply inventory update:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setImageName("");
    setScanResult(null);
    setDetectedItems([]);
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (activeTab === "camera") {
      startCameraStream();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-5 p-5 sm:p-7 relative max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-brand-950/60 flex-shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  AI Visual Inventory &amp; Shelf Scanner
                </h2>
                <span className="bg-gradient-to-r from-brand-500/20 to-amber-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Gemini Vision</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Click a photo of supermarket shelves, crates, or cartons to automatically count &amp; restock inventory
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs (Only when no image is selected yet) */}
        {!imagePreview && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("camera");
                startCameraStream();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "camera"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>📸 Live Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setActiveTab("upload");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>📁 Upload Photo / File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setActiveTab("presets");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "presets"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Quick Supermarket Presets</span>
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {!imagePreview ? (
            <div className="space-y-4">
              {/* TAB 1: LIVE CAMERA VIEW */}
              {activeTab === "camera" && (
                <div className="space-y-3">
                  <div className="relative aspect-video max-h-72 w-full rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex items-center justify-center shadow-inner group">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Camera Targeting HUD Overlay */}
                    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                        <div className="w-8 h-8 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                      </div>
                      {/* Center Target Box */}
                      <div className="self-center w-48 h-32 border border-dashed border-brand-400/60 rounded-2xl flex items-center justify-center bg-brand-500/5">
                        <span className="text-[10px] font-bold text-brand-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-brand-500/30 backdrop-blur-sm shadow">
                          Aim at Product or Crate
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="w-8 h-8 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                        <div className="w-8 h-8 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                      </div>
                    </div>

                    {/* Camera Switch Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) =>
                          prev === "environment" ? "user" : "environment"
                        )
                      }
                      className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 backdrop-blur-md transition-colors"
                      title="Switch Camera (Front/Back)"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>

                    {/* Camera Error Fallback */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <VideoOff className="w-10 h-10 text-amber-400" />
                        <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={startCameraStream}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Retry Camera
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("upload")}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Use File Upload
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={!isCameraActive}
                      onClick={capturePhotoFromCamera}
                      className="px-6 py-3 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 hover:from-brand-500 hover:to-amber-400 disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-brand-900/50 hover:scale-[1.02] transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      <span>📸 Capture Photo &amp; Scan with AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD FILE */}
              {activeTab === "upload" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-brand-500 bg-slate-950/60 hover:bg-slate-950/90 rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 group space-y-3"
                >
                  <div className="w-16 h-16 bg-slate-800 group-hover:bg-brand-600/20 text-slate-400 group-hover:text-brand-400 rounded-2xl flex items-center justify-center mx-auto transition-colors">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Click to Select or Drop Grocery Photo / Invoice
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Upload photos of stock cartons, shelf aisles, or wholesale bills (PNG, JPG, WEBP)
                    </p>
                  </div>
                  <span className="inline-block px-4 py-2 bg-slate-800 group-hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-colors">
                    Browse File from Device
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* TAB 3: QUICK PRESETS */}
              {activeTab === "presets" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Click any supermarket sample consignment to test instant AI auto-stock:</span>
                    <span className="text-[10px] text-brand-400 font-bold">1-Click Fast Test</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        key: "maggi",
                        label: "Maggi Masala Noodles (+60)",
                        subtitle: "Nestle • 60 Packs (280g)",
                        img: "/images/products/maggi_noodles.svg",
                      },
                      {
                        key: "sprite",
                        label: "Sprite Cold Drink (+48)",
                        subtitle: "Coca-Cola • 2 Crates / 48 Bottles",
                        img: "/images/products/sprite_bottle.jpg",
                      },
                      {
                        key: "surf",
                        label: "Surf Excel Detergent (+35)",
                        subtitle: "Surf Excel • 35 Bags (1kg)",
                        img: "/images/products/surf_excel.svg",
                      },
                      {
                        key: "bhujia",
                        label: "Haldiram's Bhujia (+40)",
                        subtitle: "Haldiram's • 40 Packs (400g)",
                        img: "/images/products/haldirams_bhujia.jpg",
                      },
                      {
                        key: "oil",
                        label: "Bail Kolhu Mustard Oil (+24)",
                        subtitle: "Bail Kolhu • 1 Crate (1L)",
                        img: "/images/products/bail_kolhu_oil.jpg",
                      },
                      {
                        key: "butter",
                        label: "Amul Table Butter (+30)",
                        subtitle: "Amul • 30 Blocks (500g)",
                        img: "/images/products/amul_butter.jpg",
                      },
                      {
                        key: "dettol",
                        label: "Dettol Antiseptic (+25)",
                        subtitle: "Dettol • 25 Bottles (550ml)",
                        img: "/images/products/dettol.svg",
                      },
                      {
                        key: "salt",
                        label: "Tata Iodized Salt (+80)",
                        subtitle: "Tata • 80 Packets (1kg)",
                        img: "/images/products/tata_salt.svg",
                      },
                      {
                        key: "badam",
                        label: "California Badam (+20)",
                        subtitle: "Dry Fruits • 20 Pouches (500g)",
                        img: "/images/products/california_badam.svg",
                      },
                    ].map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() =>
                          handlePresetSelect(preset.key, preset.label, preset.img)
                        }
                        className="p-3 bg-slate-950 border border-slate-800 hover:border-brand-500 rounded-2xl text-left transition-all hover:scale-[1.02] flex items-center gap-2.5 group"
                      >
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800">
                          <Image
                            src={preset.img}
                            alt={preset.label}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="40px"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-200 block truncate">
                            {preset.label}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {preset.subtitle}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* IMAGE PREVIEW & SCAN RESULTS */
            <div className="space-y-4">
              {/* Photo Display & Neon Scanner HUD */}
              <div className="relative aspect-video max-h-56 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <Image
                  src={imagePreview}
                  alt="Scanned Product Photo"
                  fill
                  className="object-contain"
                />

                {/* Laser scan sweep animation */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-brand-500/10 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-lg shadow-amber-500 animate-bounce" />
                    <div className="mt-4 bg-slate-900/95 px-5 py-2.5 rounded-2xl border border-brand-500/50 text-xs font-bold text-white flex items-center gap-2.5 shadow-2xl">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                      <span>🧠 Gemini AI Multimodal Vision Analyzing Shelf &amp; Packaging...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detected Items Results */}
              {scanResult && !isAnalyzing && (
                <div className="space-y-3">
                  {/* Summary & Engine Card */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          {scanResult.detectedDetails?.summary ||
                            `Identified ${detectedItems.length} product(s) in photo`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Review detected items and adjust restock counts before applying.
                        </span>
                      </div>
                    </div>

                    <span className="bg-brand-950/80 text-brand-300 border border-brand-800 text-[10px] font-bold px-2.5 py-1 rounded-xl self-start sm:self-auto flex-shrink-0">
                      ⚡ {aiEngineUsed}
                    </span>
                  </div>

                  {/* Detected Items Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
                    <div className="px-4 py-2.5 bg-slate-900/90 text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Detected Product Details</span>
                      <span>Restock Quantity</span>
                    </div>

                    {detectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-white text-sm">
                              {item.name}
                            </span>
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {item.confidence}% Match
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({item.unit})
                            </span>
                          </div>

                          {/* Match Selector Dropdown */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              Catalog Link:
                            </span>
                            <select
                              value={item.matchedProductId || (item.isCustomNew ? "NEW_ITEM" : "")}
                              onChange={(e) =>
                                handleItemMatchProductChange(idx, e.target.value)
                              }
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-brand-500 max-w-[260px] truncate"
                            >
                              {allProducts.length > 0 ? (
                                allProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Stock: {p.stock})
                                  </option>
                                ))
                              ) : (
                                <option value={item.matchedProductId || ""}>
                                  {item.matchedProduct?.name || item.name}
                                </option>
                              )}
                              <option value="NEW_ITEM">+ Add as New Catalog Product</option>
                            </select>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-3">
                            <span>
                              Current Stock:{" "}
                              <strong className="text-slate-200">
                                {item.stockBefore} units
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              New Stock:{" "}
                              <strong className="text-emerald-400 font-bold">
                                {item.newStock} units
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 self-end sm:self-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() =>
                              handleItemQuantityChange(idx, item.quantity - 5)
                            }
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
                            title="Decrease 5"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemQuantityChange(idx, Number(e.target.value))
                            }
                            className="w-16 text-center font-black bg-transparent text-white focus:outline-none text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleItemQuantityChange(idx, item.quantity + 5)
                            }
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
                            title="Increase 5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {successMessage && (
                    <div className="p-3.5 bg-emerald-950 border border-emerald-700 text-emerald-200 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>🎉 {successMessage}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-shrink-0">
          {imagePreview ? (
            <button
              type="button"
              onClick={resetScanner}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Take Another Photo</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              Point camera steadily at shelf stock or crate labels
            </span>
          )}

          {scanResult && !successMessage && (
            <button
              type="button"
              disabled={isApplying || detectedItems.length === 0}
              onClick={handleApplyUpdate}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 hover:from-brand-500 hover:to-amber-400 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xl shadow-brand-900/50 transition-all hover:scale-[1.02]"
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-amber-300" />
              )}
              <span>
                Confirm &amp; Update Inventory (
                {detectedItems.reduce((sum, it) => sum + it.quantity, 0)} units)
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
