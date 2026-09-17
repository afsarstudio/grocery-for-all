"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/customerAuthContext";
import Link from "next/link";
import { User, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, openAuthModal } = useCustomerAuth();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/account");
    } else {
      openAuthModal("login");
    }
  }, [isLoggedIn, openAuthModal, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card text-center space-y-4 max-w-sm w-full">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900">Customer Login &amp; Sign In</h1>
        <p className="text-xs text-slate-500">
          Sign in to access your orders, track deliveries live, and redeem your grocery points.
        </p>
        <button
          onClick={() => openAuthModal("login")}
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-all"
        >
          Open Sign In Form
        </button>
        <div className="pt-2">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
