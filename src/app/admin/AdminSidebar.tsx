"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Boxes,
  TrendingUp,
  Store,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Lock,
} from "lucide-react";
import { clearPortalAuthentication } from "@/lib/portalAuth";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      title: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "⚡ POS Billing Counter",
      href: "/staff/billing",
      icon: Receipt,
      newTab: true,
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: Package,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: ClipboardList,
    },
    {
      title: "Customers",
      href: "/admin/customers",
      icon: Users,
    },
    {
      title: "Stock & Inventory",
      href: "/admin/stock",
      icon: Boxes,
    },
    {
      title: "Sales & Analytics",
      href: "/admin/sales",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 text-white p-1 rounded-lg font-black text-xs">
            GFA
          </div>
          <span className="font-extrabold text-sm text-white">Admin Hub</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar container */}
      <aside
        className={`${
          isOpen ? "flex" : "hidden"
        } md:flex flex-col justify-between w-full md:w-64 lg:w-72 bg-slate-950 border-r border-slate-800 flex-shrink-0 p-4 z-30 md:sticky md:top-0 md:h-screen md:overflow-y-auto`}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="px-2 py-2">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="bg-brand-600 text-white p-2 rounded-xl font-black text-sm shadow">
                GFA
              </div>
              <div>
                <div className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                  <span>GROCERY FOR ALL</span>
                </div>
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                  Super Market Admin
                </div>
              </div>
            </Link>
          </div>

          {/* Store status pill */}
          <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-2xl p-3 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-emerald-300">Store Counter Live</div>
              <div className="text-[10px] text-emerald-500">Tetari Bazar, Naugarh</div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.newTab ? "_blank" : undefined}
                  rel={item.newTab ? "noopener noreferrer" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-900/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-75" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switch back to Storefront */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => {
              clearPortalAuthentication("admin");
              window.location.reload();
            }}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-rose-900/50 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Admin Session</span>
          </button>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/60 transition-colors"
          >
            <Store className="w-4 h-4 text-brand-400" />
            <span>Open Customer Store</span>
          </Link>
          <div className="text-center text-[10px] text-slate-500 font-medium">
            Naugarh Branch • Prisma + Next.js
          </div>
        </div>
      </aside>
    </>
  );
}
