"use client";

import React, { useState, useMemo } from "react";
import { Order } from "@/types";
import {
  Banknote,
  DollarSign,
  Plus,
  Trash2,
  Printer,
  Receipt,
  Calculator,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Clock,
  Store,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  note: string;
  time: string;
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: "e1", category: "Packaging & Bags", amount: 350, note: "500pcs Supermarket Carry Bags", time: "10:30 AM" },
  { id: "e2", category: "Delivery Bike Petrol", amount: 200, note: "Rider Sonu Yadav Fuel Allowance", time: "01:15 PM" },
  { id: "e3", category: "Tea & Refreshment", amount: 120, note: "Morning store tea for 4 staff", time: "11:00 AM" },
];

export default function ManagerCashDrawerClient({ initialOrders }: { initialOrders: Order[] }) {
  const [openingFloat, setOpeningFloat] = useState<number>(2000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [newCategory, setNewCategory] = useState("Packaging & Bags");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Cash Denomination Calculator
  const [denom500, setDenom500] = useState(0);
  const [denom200, setDenom200] = useState(0);
  const [denom100, setDenom100] = useState(0);
  const [denom50, setDenom50] = useState(0);
  const [denom20, setDenom20] = useState(0);
  const [denom10, setDenom10] = useState(0);
  const [denomCoins, setDenomCoins] = useState(0);

  // Calculate Cash Sales Inflow
  const cashSalesTotal = useMemo(() => {
    return initialOrders
      .filter((o) => (o.paymentMethod === "CASH" || o.paymentMethod === "COD") && o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0);
  }, [initialOrders]);

  const totalExpenseOut = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const expectedDrawerCash = openingFloat + cashSalesTotal - totalExpenseOut;

  const countedPhysicalCash =
    denom500 * 500 +
    denom200 * 200 +
    denom100 * 100 +
    denom50 * 50 +
    denom20 * 20 +
    denom10 * 10 +
    denomCoins;

  const cashDifference = countedPhysicalCash - expectedDrawerCash;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newAmount);
    if (!val || val <= 0) return;

    const newEntry: ExpenseItem = {
      id: "exp_" + Date.now(),
      category: newCategory,
      amount: val,
      note: newNote.trim() || `${newCategory} expense`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setExpenses([newEntry, ...expenses]);
    setNewAmount("");
    setNewNote("");
    setIsAddingExpense(false);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Banknote className="w-3.5 h-3.5" />
              <span>Register Reconciliation</span>
            </span>
            <span className="text-xs text-slate-400">
              Shift Cash In/Out &amp; Petty Expenses
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Cash Drawer &amp; Petty Cash Register
          </h1>
          <p className="text-xs text-slate-400">
            Monitor physical currency drawer, record petty payouts, and reconcile cashier closing balance
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer w-fit shadow"
        >
          <Printer className="w-4 h-4 text-teal-400" />
          <span>Print Handover Sheet</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Opening Float */}
        <div className="p-5 bg-slate-950 border border-teal-950 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Opening Balance</span>
            <span className="text-teal-400 flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Morning Float</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{openingFloat.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <label className="text-[10px] text-slate-400">Change float:</label>
            <input
              type="number"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
              className="w-20 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-teal-300 font-bold"
            />
          </div>
        </div>

        {/* Total Cash Inflow */}
        <div className="p-5 bg-slate-950 border border-teal-950 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Cash Sales Inflow</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Receipts</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            +₹{cashSalesTotal.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-500">
            From counter billing &amp; COD orders
          </p>
        </div>

        {/* Total Petty Cash Out */}
        <div className="p-5 bg-slate-950 border border-teal-950 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Petty Expenses Out</span>
            <span className="text-rose-400 flex items-center gap-1 font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Payouts</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">
            -₹{totalExpenseOut.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-500">
            {expenses.length} store payouts recorded
          </p>
        </div>

        {/* Expected Net Drawer Cash */}
        <div className="p-5 bg-gradient-to-br from-slate-950 to-teal-950/60 border border-teal-800/80 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-teal-300 uppercase">
            <span>Expected Drawer Cash</span>
            <span className="text-amber-300 font-extrabold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Target</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{expectedDrawerCash.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-teal-400 font-medium">
            (Opening + Sales - Payouts)
          </p>
        </div>
      </div>

      {/* Main Grid: Denomination Count (Left) + Petty Expense Payouts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Physical Currency Denomination Count Tool (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-400" />
              <span>Physical Notes &amp; Coins Count</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Total: <strong className="text-teal-300">₹{countedPhysicalCash}</strong>
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { label: "₹500 Notes", count: denom500, setter: setDenom500, multiplier: 500, color: "text-slate-200" },
              { label: "₹200 Notes", count: denom200, setter: setDenom200, multiplier: 200, color: "text-amber-300" },
              { label: "₹100 Notes", count: denom100, setter: setDenom100, multiplier: 100, color: "text-indigo-300" },
              { label: "₹50 Notes", count: denom50, setter: setDenom50, multiplier: 50, color: "text-teal-300" },
              { label: "₹20 Notes", count: denom20, setter: setDenom20, multiplier: 20, color: "text-rose-300" },
              { label: "₹10 Notes", count: denom10, setter: setDenom10, multiplier: 10, color: "text-yellow-300" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80"
              >
                <span className={`font-bold ${item.color} w-24`}>{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">x</span>
                  <input
                    type="number"
                    min={0}
                    value={item.count || ""}
                    placeholder="0"
                    onChange={(e) => item.setter(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-center text-xs focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="w-20 text-right font-bold text-slate-300">
                    = ₹{(item.count * item.multiplier).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {/* Loose Coins input */}
            <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
              <span className="font-bold text-slate-300 w-24">Loose Coins (₹)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">₹</span>
                <input
                  type="number"
                  min={0}
                  value={denomCoins || ""}
                  placeholder="0"
                  onChange={(e) => setDenomCoins(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-center text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Reconciliation Difference Alert */}
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
              cashDifference === 0
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : cashDifference > 0
                ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div>
              <div className="font-bold flex items-center gap-1.5">
                {cashDifference === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Reconciled Perfectly</span>
                  </>
                ) : cashDifference > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <span>Excess Cash: +₹{cashDifference}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Shortage in Drawer: ₹{cashDifference}</span>
                  </>
                )}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Counted: ₹{countedPhysicalCash} | Expected: ₹{expectedDrawerCash}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Petty Cash Expense Payout Log (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Today&apos;s Petty Expense Payouts</span>
              </h3>
              <p className="text-xs text-slate-400">
                Track packaging, fuel, refreshments, and store maintenance cash outs
              </p>
            </div>
            <button
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>

          {/* Add Expense Form Drawer */}
          {isAddingExpense && (
            <form
              onSubmit={handleAddExpense}
              className="p-4 bg-slate-900 border border-teal-800/80 rounded-2xl space-y-3 animate-in fade-in"
            >
              <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                New Cash Payout Entry
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Expense Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                  >
                    <option value="Packaging & Bags">Packaging Bags / Tape</option>
                    <option value="Delivery Bike Petrol">Delivery Rider Fuel / Petrol</option>
                    <option value="Tea & Refreshment">Tea &amp; Staff Refreshments</option>
                    <option value="Chiller & Ice">Chiller Ice / Cold Storage</option>
                    <option value="Store Cleaning">Store Cleaning &amp; Hygiene</option>
                    <option value="Miscellaneous">Miscellaneous Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 250"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-xs">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. 500 carry bags purchased from Tetari Bazar supplier"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow"
                >
                  Save Cash Out
                </button>
              </div>
            </form>
          )}

          {/* Expense Entries Table */}
          <div className="space-y-2.5 text-xs">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-2xl">
                No petty payouts recorded today.
              </div>
            ) : (
              expenses.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{item.category}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({item.time})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{item.note}</div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-black text-rose-400 text-sm">
                      -₹{item.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Printable Shift Handover Summary (Visible in Print) */}
      <div className="hidden print:block p-6 border border-black text-black space-y-4">
        <h2 className="text-xl font-bold text-center">GROCERY FOR ALL SUPERMARKET - SHIFT CASH HANDOVER</h2>
        <p className="text-center text-xs">Tetari Bazar, Naugarh, Uttar Pradesh | Date: {new Date().toLocaleDateString()}</p>
        <hr className="border-black" />
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p><strong>Opening Float:</strong> ₹{openingFloat}</p>
            <p><strong>Cash Sales Total:</strong> ₹{cashSalesTotal}</p>
            <p><strong>Petty Cash Paid Out:</strong> ₹{totalExpenseOut}</p>
            <p><strong>Net Expected Cash:</strong> ₹{expectedDrawerCash}</p>
          </div>
          <div>
            <p><strong>Actual Physical Counted:</strong> ₹{countedPhysicalCash}</p>
            <p><strong>Discrepancy:</strong> ₹{cashDifference}</p>
          </div>
        </div>
        <div className="pt-8 flex justify-between text-xs">
          <div>___________________<br />Cashier Signature</div>
          <div>___________________<br />Store Manager Signature</div>
        </div>
      </div>
    </div>
  );
}
