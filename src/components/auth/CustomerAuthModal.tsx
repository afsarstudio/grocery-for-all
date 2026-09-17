"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Lock,
  User,
  MapPin,
  Sparkles,
  Gift,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customerAuthContext";
import confetti from "canvas-confetti";

export default function CustomerAuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, signup } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup">(authModalTab || "login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync tab if modal opened with specific tab
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const enteredPass = password.trim() || "123456";

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (enteredPass === cleanPhone) {
      setErrorMsg("Security Alert: Mobile number and password cannot be identical! Please enter your valid password.");
      return;
    }

    setLoading(true);
    const res = await login(cleanPhone, enteredPass);
    setLoading(false);

    if (res.success) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } else {
      setErrorMsg(res.error || "Login failed");
    }
  };

  const handleAutoFillDemo = async () => {
    setPhone("9838012345");
    setPassword("123456");
    setErrorMsg(null);
    setLoading(true);
    const res = await login("9838012345", "123456");
    setLoading(false);

    if (res.success) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else {
      setErrorMsg(res.error || "Login failed");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const enteredPass = password.trim() || "123456";

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (enteredPass === cleanPhone) {
      setErrorMsg("Security Alert: Mobile number and password cannot be identical! Please enter a different password/PIN.");
      return;
    }

    setLoading(true);
    const res = await signup({
      name: name.trim(),
      phone: cleanPhone,
      password: enteredPass,
      address: address.trim() || "Tetari Bazar, Naugarh",
      email: email.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      setErrorMsg(res.error || "Sign-up failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 relative my-8 border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-900 text-xs font-bold px-3.5 py-1 rounded-full mb-0.5 shadow-xs">
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            <span>Hello! Get 50 Welcome Points (₹50 OFF)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {activeTab === "login" ? "Sign In to Grocery for All" : "Create Customer Account"}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {activeTab === "login"
              ? "Login with your mobile number for live order tracking, ₹50 reward points & 30-min express delivery in Naugarh."
              : "Register to earn 50 welcome points and get exclusive member deals on fresh groceries."}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
          <button
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "login"
                ? "bg-white text-slate-900 shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "signup"
                ? "bg-white text-brand-600 shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            New Account
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border-2 border-rose-300 text-rose-800 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-start gap-2 animate-shake shadow-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMsg}</div>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mobile Number
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  10 Digits
                </span>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/90 border-r border-slate-200 text-slate-700 font-bold text-xs select-none flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(val);
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Enter your 10-digit mobile number (e.g. 9838012345)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password / PIN
                </label>
                <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-1.5 py-0.5 rounded">
                  Default PIN: 123456
                </span>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden">
                <div className="flex items-center justify-center pl-3 text-slate-400 flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password or PIN (Default: 123456)"
                  className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 1-Click Demo Fill for easy testing */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="text-[11px] text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 cursor-pointer bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors border border-brand-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Auto-fill Demo (9838012345)</span>
              </button>
              <span className="text-[10px] text-slate-400">Default PIN: 123456</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-glow flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Continue as Guest */}
            <button
              type="button"
              onClick={closeAuthModal}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Skip &amp; Continue Browsing Products &rarr;
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden">
                <div className="flex items-center justify-center pl-3 text-slate-400 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name (e.g. Ramesh Chandra)"
                  className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mobile Number *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  10 Digits
                </span>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/90 border-r border-slate-200 text-slate-700 font-bold text-xs select-none flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(val);
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Address in Naugarh (Tetari Bazar)
              </label>
              <div className="flex items-start rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden p-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-1 ml-1 mr-2 flex-shrink-0" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Ward #4, Rahul Nagar, Near Shiv Mandir, Naugarh"
                  className="w-full bg-transparent text-slate-900 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400 resize-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Set Password / PIN
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  (Optional - Default: 123456)
                </span>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all overflow-hidden">
                <div className="flex items-center justify-center pl-3 text-slate-400 flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set your 6-digit PIN (e.g. 123456)"
                  className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Quick Demo Fill on Signup */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setName("Ramesh Verma");
                  setPhone("9838012345");
                  setAddress("House 42, Tetari Bazar Main Road, Naugarh");
                  setPassword("123456");
                }}
                className="text-[11px] text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 cursor-pointer bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-lg transition-colors border border-brand-200"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Auto-fill Sample Info</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-glow flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Claim 50 Points &amp; Register</span>
                </>
              )}
            </button>

            {/* Continue as Guest */}
            <button
              type="button"
              onClick={closeAuthModal}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Skip &amp; Continue Browsing Products &rarr;
            </button>
          </form>
        )}

        {/* Benefits banner footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Customer Login</span>
          </div>
          <span className="text-amber-600 font-bold">1 Point = ₹1 Discount</span>
        </div>
      </div>
    </div>
  );
}
