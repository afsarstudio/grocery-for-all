"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import PortalPasswordModal from "../auth/PortalPasswordModal";
import { PortalRole } from "@/lib/portalAuth";

export default function Footer() {
  const pathname = usePathname();
  const [portalAuthRole, setPortalAuthRole] = useState<PortalRole | null>(null);
  const isDedicatedApp =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/pos");
  if (isDedicatedApp) return null;

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      {/* Feature Value Props Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 border-b border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Fast Local Delivery
              </h4>
              <p className="text-[11px] text-slate-400">At your doorstep in 30-45 mins</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                100% Genuine Brands
              </h4>
              <p className="text-[11px] text-slate-400">Directly sourced fresh stock</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                4.4★ Rated Store
              </h4>
              <p className="text-[11px] text-slate-400">93+ Happy customer reviews</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Easy Replacements
              </h4>
              <p className="text-[11px] text-slate-400">Hassle-free support at store</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Store Intro */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 text-white p-1.5 rounded-xl font-black text-sm">
              GFA
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              GROCERY FOR ALL
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Naugarh&apos;s trusted modern supermarket for daily groceries, flours, pulses, premium basmati rice, spices, cold beverages, and personal essentials.
          </p>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 w-fit">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < 4 ? "fill-amber-400" : "fill-amber-400/50"}`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-white">4.4 / 5.0</span>
            <span className="text-[10px] text-slate-400">(93 Google Reviews)</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
            Quick Categories
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <Link href="/products?category=atta-flours-sooji" className="hover:text-brand-400 transition-colors">
                Atta, Maida, Sooji & Flours
              </Link>
            </li>
            <li>
              <Link href="/products?category=dals-pulses" className="hover:text-brand-400 transition-colors">
                Unpolished Dals & Pulses
              </Link>
            </li>
            <li>
              <Link href="/products?category=rice-grains" className="hover:text-brand-400 transition-colors">
                Aromatic Basmati Rice & Poha
              </Link>
            </li>
            <li>
              <Link href="/products?category=edible-oils-ghee" className="hover:text-brand-400 transition-colors">
                Kacchi Ghani Mustard Oil & Pure Ghee
              </Link>
            </li>
            <li>
              <Link href="/products?category=snacks-beverages" className="hover:text-brand-400 transition-colors">
                Cold Drinks, Sprite & Namkeens
              </Link>
            </li>
          </ul>
        </div>

        {/* Store Location & Timings */}
        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
            Store Location & Hours
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
              <span>
                Rahul Nagar, Khajuriya, Tetari Bazar, Naugarh, Uttar Pradesh 272207
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Open 7 Days a Week: 8:00 AM – 10:00 PM</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>+91 98765 43210</span>
            </li>
          </ul>
        </div>

        {/* Admin & Customer Support */}
        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
            Store Support & Portal
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Looking for orders, invoices, or supermarket inventory controls?
          </p>
          <div className="space-y-2">
            <Link
              href="/orders"
              className="block text-center py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Track Order Status
            </Link>
            <button
              type="button"
              onClick={() => setPortalAuthRole("admin")}
              className="w-full text-center py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Open Admin Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} Grocery for All Super Market. All rights reserved.</p>
        <p>Built with Next.js, Prisma ORM & PostgreSQL</p>
      </div>

      {/* Security Portal Password Prompt Modal */}
      <PortalPasswordModal
        role={portalAuthRole}
        onClose={() => setPortalAuthRole(null)}
      />
    </footer>
  );
}
