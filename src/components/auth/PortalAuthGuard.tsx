"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PortalRole,
  PORTAL_DETAILS,
  PORTAL_PASSWORDS,
  verifyPortalPassword,
  isPortalAuthenticated,
  setPortalAuthenticated,
  clearPortalAuthentication,
} from "@/lib/portalAuth";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Store,
  ArrowRight,
  LogOut,
} from "lucide-react";

interface PortalAuthGuardProps {
  role: PortalRole;
  children: React.ReactNode;
}

export default function PortalAuthGuard({
  role,
  children,
}: PortalAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated in session
    const authed = isPortalAuthenticated(role);
    setIsAuthenticated(authed);
  }, [role]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }

    const isValid = verifyPortalPassword(role, password);
    if (isValid) {
      setError("");
      setPortalAuthenticated(role);
      setIsAuthenticated(true);
    } else {
      setError("❌ Incorrect password. Access denied.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword("");
    }
  };

  const handleLock = () => {
    clearPortalAuthentication(role);
    setIsAuthenticated(false);
    setPassword("");
  };

  // While checking initial authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying access security...</span>
        </div>
      </div>
    );
  }

  // If locked / not authenticated, show full lock screen
  if (!isAuthenticated) {
    const details = PORTAL_DETAILS[role];

    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-3 sm:p-4 overflow-y-auto antialiased text-slate-100 selection:bg-brand-500 selection:text-white">
        <div
          className={`w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto transition-all ${
            isShaking ? "animate-shake" : ""
          }`}
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
              role === "admin"
                ? "bg-amber-500"
                : role === "manager"
                ? "bg-teal-500"
                : "bg-emerald-500"
            }`}
          />

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl ${details.badgeBg}`}
            >
              <Lock className={`w-6 h-6 ${details.badgeText}`} />
            </div>
            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${details.badgeBg} ${details.badgeText}`}
              >
                {details.roleLabel}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
                {details.title}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
                {details.subtitle}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Enter Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  autoFocus
                  placeholder={
                    role === "admin"
                      ? "Enter Admin Password"
                      : role === "manager"
                      ? "Enter Manager PIN"
                      : "Enter Staff POS PIN"
                  }
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* DIRECT PASSWORD HELPER BELOW INPUT */}
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Default PIN:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(PORTAL_PASSWORDS[role]);
                      if (error) setError("");
                    }}
                    className="font-mono font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>{PORTAL_PASSWORDS[role]}</span>
                    <span className="text-[10px] text-amber-200/70 font-sans font-normal">(Click to Fill)</span>
                  </button>
                </div>

                {/* All passwords list */}
                <div className="pt-1.5 border-t border-slate-800/80">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    All Portal Passwords:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setPassword(PORTAL_PASSWORDS.admin);
                        if (error) setError("");
                      }}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        role === "admin"
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-amber-400">Admin</div>
                      <div className="font-mono font-bold text-xs">{PORTAL_PASSWORDS.admin}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPassword(PORTAL_PASSWORDS.manager);
                        if (error) setError("");
                      }}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        role === "manager"
                          ? "bg-teal-500/20 border-teal-500/50 text-teal-200"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-teal-400">Manager</div>
                      <div className="font-mono font-bold text-xs">{PORTAL_PASSWORDS.manager}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPassword(PORTAL_PASSWORDS.staff);
                        if (error) setError("");
                      }}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        role === "staff"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-emerald-400">Staff POS</div>
                      <div className="font-mono font-bold text-xs">{PORTAL_PASSWORDS.staff}</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold animate-in fade-in">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${details.buttonBg}`}
            >
              <span>Unlock &amp; Access Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Back to Store */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-[11px]"
            >
              <Store className="w-3.5 h-3.5 text-brand-400" />
              <span>Back to Storefront</span>
            </Link>
            <span className="text-[10px] text-slate-500 font-medium">
              Grocery for All • Naugarh
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render children when authenticated
  return <>{children}</>;
}
