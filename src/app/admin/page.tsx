import React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  Store,
} from "lucide-react";
import { getAdminKPIs, getOrders, getProducts } from "@/lib/actions";
import AdminOrderRow from "./AdminOrderRow";

export const revalidate = 0;

export default async function AdminOverviewPage() {
  const [kpis, recentOrders, lowStockProducts] = await Promise.all([
    getAdminKPIs(),
    getOrders(),
    getProducts({ inStockOnly: false } as any),
  ]);

  const urgentLowStock = lowStockProducts.filter((p) => p.stock <= 15).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            Supermarket Live Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Store Performance &amp; Ops
          </h1>
          <p className="text-xs text-slate-400">
            Grocery for All • Tetari Bazar, Naugarh, UP
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
          <Link
            href="/admin/stock"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
          >
            Replenish Stock
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              ₹{kpis.totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Direct sales from store &amp; online</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{kpis.totalOrders}</div>
            <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
              {kpis.pendingOrdersCount} orders currently in progress
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Customers
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{kpis.customersCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Naugarh &amp; Tetari Bazar local buyers
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{kpis.lowStockProducts}</div>
            <div className="text-[11px] text-rose-400 font-semibold mt-0.5">
              Products with stock ≤ 15 units
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Recent Orders & Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Queue */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Live Orders Queue</h2>
              <p className="text-xs text-slate-400">
                Update status in real-time to notify customers
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No orders placed yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 overflow-x-auto">
              {recentOrders.slice(0, 5).map((order) => (
                <AdminOrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Low Stock Watchlist</h2>
              <p className="text-xs text-slate-400">Items requiring warehouse reorder</p>
            </div>
            <Link
              href="/admin/stock"
              className="text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              Restock
            </Link>
          </div>

          {urgentLowStock.length === 0 ? (
            <div className="p-6 text-center text-emerald-400 text-xs font-semibold">
              ✨ All supermarket items have healthy stock levels!
            </div>
          ) : (
            <div className="space-y-3">
              {urgentLowStock.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white truncate">{prod.name}</div>
                    <div className="text-[11px] text-slate-400">{prod.unit}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block font-extrabold text-xs px-2.5 py-0.5 rounded-md ${
                        prod.stock <= 0
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {prod.stock} Left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
