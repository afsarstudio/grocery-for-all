"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Radio,
  Sparkles,
  CloudRain,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Save,
  RotateCcw,
  Zap,
  Tag,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function ManagerBroadcastClient() {
  const [storeStatus, setStoreStatus] = useState<"NORMAL" | "RUSH" | "RAIN" | "CLOSED">("NORMAL");
  const [announcementText, setAnnouncementText] = useState("Express 30-Min Delivery in Naugarh & Tetari Bazar");
  const [flashDealText, setFlashDealText] = useState("Weekend Special: Buy 5kg Fortune Atta & Get 1kg Tata Salt FREE!");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem("gfa_broadcast_status") as any;
      const savedNotice = localStorage.getItem("gfa_broadcast_notice");
      const savedDeal = localStorage.getItem("gfa_broadcast_deal");
      if (savedStatus) setStoreStatus(savedStatus);
      if (savedNotice) setAnnouncementText(savedNotice);
      if (savedDeal) setFlashDealText(savedDeal);
    } catch {}
  }, []);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("gfa_broadcast_status", storeStatus);
      localStorage.setItem("gfa_broadcast_notice", announcementText);
      localStorage.setItem("gfa_broadcast_deal", flashDealText);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save broadcast:", err);
    }
  };

  const handleReset = () => {
    setStoreStatus("NORMAL");
    setAnnouncementText("Express 30-Min Delivery in Naugarh & Tetari Bazar");
    setFlashDealText("Weekend Special: Buy 5kg Fortune Atta & Get 1kg Tata Salt FREE!");
    try {
      localStorage.removeItem("gfa_broadcast_status");
      localStorage.removeItem("gfa_broadcast_notice");
      localStorage.removeItem("gfa_broadcast_deal");
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Storefront Control</span>
            </span>
            <span className="text-xs text-slate-400">
              Live Customer Announcements &amp; Delivery Status
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Store Live Notice &amp; Broadcast Desk
          </h1>
          <p className="text-xs text-slate-400">
            Publish real-time banners, delivery delay advisories, and flash supermarket promos directly on customer website
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Broadcast Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6">
          <form onSubmit={handlePublish} className="space-y-5">
            {/* 1. Store Delivery Status Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Store Operating &amp; Delivery Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: "NORMAL", label: "Normal Express", dot: "bg-emerald-400", sub: "30-45 Mins" },
                  { id: "RUSH", label: "Rush Hour", dot: "bg-amber-400", sub: "45-60 Mins" },
                  { id: "RAIN", label: "Rain Mode", dot: "bg-blue-400", sub: "Weather Delay" },
                  { id: "CLOSED", label: "Counter Only", dot: "bg-rose-400", sub: "Delivery Paused" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setStoreStatus(mode.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      storeStatus === mode.id
                        ? `bg-teal-950/80 border-teal-400 text-white shadow-lg`
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${mode.dot} flex-shrink-0`} />
                      <span>{mode.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 pl-4">{mode.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Top Bar Announcement Text */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Top Bar Announcement Marquee
              </label>
              <input
                type="text"
                required
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Express 30-Min Delivery in Naugarh & Tetari Bazar"
                className="w-full p-3 bg-slate-900 border border-slate-700/90 rounded-2xl text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Appears at the very top of customer homepage across all devices.
              </p>
            </div>

            {/* 3. Flash Deal Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Today&apos;s Flash Deal / Promo Ticker
              </label>
              <textarea
                rows={2}
                value={flashDealText}
                onChange={(e) => setFlashDealText(e.target.value)}
                placeholder="e.g. Weekend Special: Buy 5kg Fortune Atta & Get 1kg Tata Salt FREE!"
                className="w-full p-3 bg-slate-900 border border-slate-700/90 rounded-2xl text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
              />
            </div>

            {/* Save & Reset Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/40 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? "Published Live!" : "Publish to Storefront"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Live Storefront Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-400" />
              <span>Live Customer Store Preview</span>
            </h3>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
              Live Mock
            </span>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">
            {/* Top Micro-Bar Mock */}
            <div className="bg-brand-900 text-slate-100 text-[11px] p-2 rounded-xl flex items-center justify-between">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{announcementText}</span>
              </span>
              <span className="text-slate-400 hidden sm:inline">98765 43210</span>
            </div>

            {/* Store Status Banner Mock */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                storeStatus === "NORMAL"
                  ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                  : storeStatus === "RUSH"
                  ? "bg-amber-950/60 border-amber-800 text-amber-300"
                  : storeStatus === "RAIN"
                  ? "bg-blue-950/60 border-blue-800 text-blue-300"
                  : "bg-rose-950/60 border-rose-800 text-rose-300"
              }`}
            >
              <Zap className="w-4 h-4 flex-shrink-0" />
              <div>
                <strong className="block font-bold">
                  {storeStatus === "NORMAL"
                    ? "Express 30-Min Delivery Active in Naugarh"
                    : storeStatus === "RUSH"
                    ? "Peak Store Rush — Delivery in 45-60 Mins"
                    : storeStatus === "RAIN"
                    ? "Rainy Weather Alert — Deliveries slightly delayed"
                    : "Online Delivery Paused — Counter Open at Tetari Bazar"}
                </strong>
              </div>
            </div>

            {/* Flash Deal Mock */}
            {flashDealText && (
              <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{flashDealText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
