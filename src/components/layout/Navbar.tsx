"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  MapPin,
  Clock,
  Phone,
  LayoutDashboard,
  Grid,
  ClipboardList,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  User,
  UserCheck,
  LogOut,
  Gift,
  Award,
} from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { useCustomerAuth } from "@/lib/customerAuthContext";
import SearchBar from "../ui/SearchBar";
import PortalPasswordModal from "../auth/PortalPasswordModal";
import { PortalRole } from "@/lib/portalAuth";

export default function Navbar() {
  const { itemCount, total, setIsCartOpen } = useCart();
  const { customer, isLoggedIn, openAuthModal, logout } = useCustomerAuth();
  const pathname = usePathname();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [portalAuthRole, setPortalAuthRole] = useState<PortalRole | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // If in admin dashboard, manager portal, or staff POS, hide regular customer navbar
  const isDedicatedApp =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/pos");
  if (isDedicatedApp) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro-bar */}
      <div className="bg-brand-900 text-slate-100 text-[11px] sm:text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-medium text-amber-300">
              <Sparkles className="w-3 h-3" />
              Express 30-Min Delivery in Naugarh & Tetari Bazar
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-emerald-400" />
              Open Closes 10:00 PM
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
              <Phone className="w-3 h-3" />
              +91 98765 43210
            </span>
            <button
              type="button"
              onClick={() => setPortalAuthRole("staff")}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-bold transition-colors text-[11px] shadow-sm cursor-pointer"
            >
              <span>⚡ Staff POS</span>
            </button>
            <button
              type="button"
              onClick={() => setPortalAuthRole("manager")}
              className="flex items-center gap-1 bg-teal-800 hover:bg-teal-700 text-teal-200 px-2.5 py-0.5 rounded-full font-semibold transition-colors text-[11px] cursor-pointer"
            >
              <UserCheck className="w-3 h-3 text-teal-300" />
              <span>Manager Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setPortalAuthRole("admin")}
              className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-700 text-amber-300 px-2.5 py-0.5 rounded-full font-semibold transition-colors text-[11px] cursor-pointer"
            >
              <LayoutDashboard className="w-3 h-3" />
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo matching store signboard */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative flex items-center">
              <div className="bg-brand-600 text-white p-2 rounded-2xl shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
                <span className="font-extrabold text-lg tracking-tighter leading-none text-yellow-300">
                  G
                </span>
                <span className="font-bold text-sm tracking-tight leading-none text-white ml-0.5">
                  rocery
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-brand-600 leading-none">
                  GROCERY
                </span>
                <span className="text-xs font-black bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">
                  FOR ALL
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                Super Market • Naugarh
              </span>
            </div>
          </Link>

          {/* Location selector / indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-xs text-slate-700 border border-slate-200 cursor-pointer">
            <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <div className="text-left">
              <div className="font-bold text-slate-900">Tetari Bazar, Naugarh</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                UP 272207 (Express)
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-2">
            <SearchBar />
          </div>

          {/* Navigation links, Customer Auth & Cart action */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/categories"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/categories"
                  ? "bg-brand-50 text-brand-600"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Grid className="w-4 h-4 text-brand-600" />
              <span>Categories</span>
            </Link>

            {isLoggedIn && (
              <Link
                href="/orders"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname.startsWith("/orders")
                    ? "bg-brand-50 text-brand-600"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ClipboardList className="w-4 h-4 text-slate-500" />
                <span>Orders</span>
              </Link>
            )}

            {/* Customer Authentication / Profile Pill */}
            {!isLoggedIn ? (
              <button
                onClick={() => openAuthModal("login")}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200/80 cursor-pointer"
              >
                <User className="w-4 h-4 text-brand-600" />
                <span className="hidden sm:inline">Sign In</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full shadow-xs">
                  🎁 50 Pts
                </span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-900 transition-all shadow-xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {customer?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="text-left hidden sm:block leading-tight">
                    <div className="font-black text-xs truncate max-w-[85px] text-slate-900">
                      {customer?.name?.split(" ")[0]}
                    </div>
                    <div className="text-[10px] text-amber-800 font-extrabold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                      <span>{customer?.points || 0} pts</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-2.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    {/* Points Banner inside dropdown */}
                    <div className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Loyalty Points Balance
                      </span>
                      <div className="text-sm font-black text-slate-900 flex items-center justify-between">
                        <span>⭐ {customer?.points || 0} Pts</span>
                        <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                          ₹{customer?.points || 0} OFF
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-colors"
                    >
                      <User className="w-4 h-4 text-brand-600" />
                      <span>My Account &amp; Rewards</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-colors"
                    >
                      <ClipboardList className="w-4 h-4 text-slate-500" />
                      <span>My Orders History</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 sm:py-2.5 rounded-2xl font-bold shadow-sm hover:shadow-glow active:scale-95 transition-all duration-200"
              aria-label="Open cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[10px] text-rose-100 uppercase tracking-wider font-medium">
                  {itemCount} items
                </span>
                <span className="text-xs font-bold">₹{total.toFixed(0)}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search bar row */}
        <div className="mt-2.5 md:hidden">
          <SearchBar />
        </div>
      </div>

      {/* Security Portal Password Prompt Modal */}
      <PortalPasswordModal
        role={portalAuthRole}
        onClose={() => setPortalAuthRole(null)}
      />
    </header>
  );
}
