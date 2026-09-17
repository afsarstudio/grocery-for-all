"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  PieChart,
  BarChart3,
  Sparkles,
  Award,
} from "lucide-react";
import { Order, Product, Category } from "@/types";

interface AdminSalesClientProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  totalRevenue: number;
  totalItemsSold: number;
  averageOrderValue: number;
}

export default function AdminSalesClient({
  orders,
  products,
  categories,
  totalRevenue,
  totalItemsSold,
  averageOrderValue,
}: AdminSalesClientProps) {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "ALL">("30D");

  // Calculate top selling items
  const productSalesMap: Record<string, { count: number; revenue: number; name: string; image: string }> = {};

  orders.forEach((order) => {
    if (order.status === "CANCELLED") return;
    order.items.forEach((item) => {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = {
          count: 0,
          revenue: 0,
          name: item.productName,
          image: item.productImage,
        };
      }
      productSalesMap[item.productName].count += item.quantity;
      productSalesMap[item.productName].revenue += item.price * item.quantity;
    });
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Daily revenue simulation
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const revenueByDay = [1420, 1890, 2300, 1950, 3200, 4850, 4100];
  const maxDayRevenue = Math.max(...revenueByDay);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            Supermarket Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sales &amp; Financial Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Revenue trends, popular grocery items, and average order basket size
          </p>
        </div>

        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-bold">
          {(["7D", "30D", "ALL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === t ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "7D" ? "Last 7 Days" : t === "30D" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Gross Supermarket Revenue
          </span>
          <div className="text-3xl font-black text-white">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>High repeat order rate in Naugarh</span>
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Average Basket Value (AOV)
          </span>
          <div className="text-3xl font-black text-amber-300">
            ₹{averageOrderValue.toFixed(0)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Average customer cart size per checkout
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Grocery Units Dispatched
          </span>
          <div className="text-3xl font-black text-blue-400">
            {totalItemsSold} units
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Across flour, rice, dals, oils &amp; beverages
          </p>
        </div>
      </div>

      {/* 2-Column: Weekly Trend & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Chart */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <span>Weekly Revenue Distribution</span>
              </h2>
              <p className="text-xs text-slate-400">
                Peak shopping surges on Friday, Saturday &amp; Sunday
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
              +18.4% WoW
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {days.map((day, idx) => {
                const val = revenueByDay[idx];
                const heightPercent = Math.round((val / maxDayRevenue) * 100);

                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{val}
                    </div>
                    <div className="w-full bg-slate-800 rounded-t-xl overflow-hidden h-36 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-brand-600 to-amber-400 rounded-t-xl group-hover:brightness-110 transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart footer notes */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span>Highest Trading Day: <strong>Saturday (₹4,850)</strong></span>
            <span>Express Delivery Share: <strong>72%</strong></span>
          </div>
        </div>

        {/* Top Products Leaderboard */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Selling Items</span>
            </h2>
            <span className="text-xs text-slate-400">By Revenue</span>
          </div>

          <div className="space-y-3">
            {topSellingProducts.map((p, idx) => (
              <div
                key={p.name}
                className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-black text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate max-w-[160px]">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.count} units sold</div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-black text-amber-300">₹{p.revenue.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
