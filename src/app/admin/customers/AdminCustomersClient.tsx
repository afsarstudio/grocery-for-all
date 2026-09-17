"use client";

import React, { useState } from "react";
import { Users, Search, Phone, MapPin, Mail, ShoppingBag, Award } from "lucide-react";
import { Customer } from "@/types";

export default function AdminCustomersClient({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            Customer Directory
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Registered Customers ({customers.length})
          </h1>
          <p className="text-xs text-slate-400">
            Local Naugarh &amp; Tetari Bazar customer CRM profiles &amp; history
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Customers Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const totalOrders = customer.orders?.length || 0;
          const totalSpend = customer.orders?.reduce((sum, o) => sum + o.total, 0) || 0;

          return (
            <div
              key={customer.id}
              className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-brand-500/50 transition-all shadow-card"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 font-black text-sm flex items-center justify-center">
                    {customer.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{customer.name}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                </div>

                {totalOrders >= 2 && (
                  <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Loyal Buyer</span>
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="text-xs text-slate-400 flex items-start gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {customer.address || "Naugarh, Uttar Pradesh 272207"}
                </span>
              </div>

              {/* Order & Points Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="bg-slate-900/40 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    Orders
                  </span>
                  <span className="text-sm font-black text-white">{totalOrders}</span>
                </div>

                <div className="bg-slate-900/40 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    Spent
                  </span>
                  <span className="text-sm font-black text-amber-300">
                    ₹{totalSpend.toFixed(0)}
                  </span>
                </div>

                <div className="bg-slate-900/40 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-amber-500 block uppercase font-bold">
                    Points
                  </span>
                  <span className="text-sm font-black text-emerald-400">
                    ⭐ {customer.points || 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
