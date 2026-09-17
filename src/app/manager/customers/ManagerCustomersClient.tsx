"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  Sparkles,
  Gift,
  Award,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Customer } from "@/types";

export default function ManagerCustomersClient({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Customer CRM &amp; Loyalty Desk</span>
            </span>
            <span className="text-xs text-slate-400">
              {customers.length} registered customers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Directory &amp; Loyalty Points
          </h1>
          <p className="text-xs text-slate-400">
            Manage customer relations, view reward wallets, and contact Naugarh shoppers
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Total Registered Customers
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {customers.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Total Loyalty Points Issued
            </span>
            <div className="text-2xl font-black text-amber-400 mt-0.5 flex items-center gap-1.5">
              <Award className="w-6 h-6 text-amber-400" />
              <span>{totalPoints.toLocaleString("en-IN")} pts</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              Points Cash Value
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              ₹{(totalPoints * 0.5).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, mobile, address..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Customers List Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Delivery Address in Naugarh</th>
                <th className="py-3.5 px-4">Loyalty Balance</th>
                <th className="py-3.5 px-4">Total Orders</th>
                <th className="py-3.5 px-4 text-right">Quick Connect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No customers found matching this query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {c.name}
                          </div>
                          <span className="text-[10px] text-teal-400 font-medium">
                            Joined {new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-400 truncate max-w-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{c.address || "Naugarh, Tetari Bazar, UP"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2.5 py-0.5 rounded-full text-xs">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>{c.points || 0} pts</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200">
                        {c._count?.orders || 0} orders
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-400" />
                        </a>
                        <a
                          href={`https://wa.me/91${c.phone.replace(/[^0-9]/g, "").slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 rounded-lg border border-emerald-800/60 transition-colors"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
