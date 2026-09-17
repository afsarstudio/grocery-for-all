"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  PortalRole,
  PORTAL_DETAILS,
  PORTAL_PASSWORDS,
  verifyPortalPassword,
  setPortalAuthenticated,
} from "@/lib/portalAuth";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  ShieldAlert,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface PortalPasswordModalProps {
  role: PortalRole | null;
  onClose: () => void;
}

export default function PortalPasswordModal({
  role,
  onClose,
}: PortalPasswordModalProps) {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (role) {
      setPassword("");
      setError("");
      setShowPassword(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [role]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && role) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [role, onClose]);

  if (!mounted || !role) return null;

  const details = PORTAL_DETAILS[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the password to proceed.");
      return;
    }

    const isValid = verifyPortalPassword(role, password);
    if (isValid) {
      setError("");
      setPortalAuthenticated(role);
      window.open(details.href, "_blank", "noopener,noreferrer");
      onClose();
    } else {
      setError("❌ Incorrect password. Please check and try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword("");
      inputRef.current?.focus();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex min-h-screen w-screen items-center justify-center p-4 antialiased">
      <div
        className={`relative w-full max-w-md bg-slate-900 border border-slate-700/90 text-slate-100 rounded-3xl shadow-2xl p-6 sm:p-7 my-auto transition-all ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Glow effect */}
        <div
          className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl opacity-25 pointer-events-none ${
            role === "admin"
              ? "bg-amber-500"
              : role === "manager"
              ? "bg-teal-500"
              : "bg-emerald-500"
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner flex-shrink-0 ${details.badgeBg}`}
          >
            <Lock className={`w-5 h-5 ${details.badgeText}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${details.badgeBg} ${details.badgeText}`}
              >
                {details.roleLabel}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white mt-1">
              Security PIN / Password
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Enter authorization password for <strong className="text-slate-200">{details.title}</strong>:
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Enter Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder={
                  role === "admin"
                    ? "Enter Admin password"
                    : role === "manager"
                    ? "Enter Manager PIN"
                    : "Enter Staff POS PIN"
                }
                className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-700/90 rounded-2xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-inner"
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

            {/* DIRECT PASSWORD HELPER CARD BELOW INPUT */}
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Password for <strong className="text-amber-300">{details.roleLabel}</strong>:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(PORTAL_PASSWORDS[role]);
                    if (error) setError("");
                  }}
                  className="font-mono font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>{PORTAL_PASSWORDS[role]}</span>
                  <span className="text-[10px] text-amber-200/80 font-sans font-bold bg-amber-500/20 px-1 py-0.2 rounded">
                    Fill
                  </span>
                </button>
              </div>

              {/* All passwords quick grid */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                  All Portal Passwords (Click to fill):
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(PORTAL_PASSWORDS.admin);
                      if (error) setError("");
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "admin"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-amber-400">Admin</div>
                    <div className="font-mono font-bold text-xs mt-0.5">{PORTAL_PASSWORDS.admin}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPassword(PORTAL_PASSWORDS.manager);
                      if (error) setError("");
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "manager"
                        ? "bg-teal-500/20 border-teal-500/50 text-teal-200 ring-1 ring-teal-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-teal-400">Manager</div>
                    <div className="font-mono font-bold text-xs mt-0.5">{PORTAL_PASSWORDS.manager}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPassword(PORTAL_PASSWORDS.staff);
                      if (error) setError("");
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "staff"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 ring-1 ring-emerald-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-emerald-400">Staff POS</div>
                    <div className="font-mono font-bold text-xs mt-0.5">{PORTAL_PASSWORDS.staff}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold animate-in fade-in">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${details.buttonBg}`}
            >
              <span>Unlock & Open</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Security watermark */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Protected Supermarket Portal
          </span>
          <span>Naugarh Branch</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
