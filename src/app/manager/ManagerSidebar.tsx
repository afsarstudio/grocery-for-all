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
  FileText,
  Store,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Receipt,
  UserCheck,
  Sparkles,
  Truck,
  Layers,
  ArrowUpRight,
  Lock,
  Banknote,
  Megaphone,
} from "lucide-react";
import { clearPortalAuthentication } from "@/lib/portalAuth";

export default function ManagerSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      title: "Store Overview",
      href: "/manager",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Orders & Dispatch",
      href: "/manager/orders",
      icon: ClipboardList,
    },
    {
      title: "Rider Dispatch",
      href: "/manager/dispatch",
      icon: Truck,
    },
    {
      title: "Inventory & Restock",
      href: "/manager/inventory",
      icon: Boxes,
    },
    {
      title: "Cash Drawer & Float",
      href: "/manager/cash-drawer",
      icon: Banknote,
    },
    {
      title: "POS Counter Monitor",
      href: "/manager/pos",
      icon: Receipt,
    },
    {
      title: "Store Notice & Broadcast",
      href: "/manager/broadcast",
      icon: Megaphone,
    },
    {
      title: "Customer Loyalty CRM",
      href: "/manager/customers",
      icon: Users,
    },
    {
      title: "Daily Closing Report",
      href: "/manager/reports",
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden bg-slate-950 border-b border-teal-900/50 p-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-teal-900/50">
            GM
          </div>
          <div>
            <span className="font-extrabold text-sm text-white block leading-tight">
              Manager Desk
            </span>
            <span className="text-[10px] text-teal-400 font-semibold">
              Tetari Bazar Store
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar container */}
      <aside
        className={`${
          isOpen ? "flex" : "hidden"
        } md:flex flex-col justify-between w-full md:w-64 lg:w-72 bg-slate-950 border-r border-teal-950/80 flex-shrink-0 p-4 z-30 md:sticky md:top-0 md:h-screen md:overflow-y-auto`}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="px-2 py-1">
            <Link href="/manager" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-teal-900/40 border border-teal-400/30 flex-shrink-0">
                GFA
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                  <span>GROCERY FOR ALL</span>
                </div>
                <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Store Manager</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Store shift live pill */}
          <div className="bg-gradient-to-r from-teal-950/80 to-slate-900 border border-teal-800/40 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-teal-200 truncate">
                Naugarh Supermarket Live
              </div>
              <div className="text-[10px] text-slate-400">
                Manager: Ramesh (On Duty)
              </div>
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
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-900/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switcher & Shortcuts */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2 mt-4">
          <Link
            href="/staff/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full py-2 px-3 bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 text-xs font-bold rounded-xl border border-teal-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-400" />
              <span>Launch POS Billing</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-75" />
          </Link>

          <Link
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Master Admin Hub</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-75" />
          </Link>

          <button
            type="button"
            onClick={() => {
              clearPortalAuthentication("manager");
              window.location.reload();
            }}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-rose-900/50 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Manager Session</span>
          </button>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-slate-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors"
          >
            <Store className="w-4 h-4 text-brand-400" />
            <span>Open Customer Store</span>
          </Link>

          <div className="text-center text-[10px] text-slate-500 font-medium pt-1">
            Grocery for All • Tetari Bazar, Naugarh
          </div>
        </div>
      </aside>
    </>
  );
}
