"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { customerLogin, customerSignup, getCustomerProfile, updateCustomerProfile } from "./actions";

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city: string;
  pincode: string;
  points: number;
  ordersCount?: number;
  recentOrders?: any[];
  createdAt?: string | Date;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup";
  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
  login: (phone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    name: string;
    phone: string;
    password?: string;
    address?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
  updateProfile: (data: { name?: string; address?: string; email?: string }) => Promise<boolean>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const STORAGE_KEY = "gfa_customer_session";

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");

  // Load active session from localStorage & auto-prompt signin on visit
  useEffect(() => {
    let hasSession = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.phone) {
          hasSession = true;
          setCustomer(parsed);
          // Sync fresh profile from server
          getCustomerProfile(parsed.phone).then((fresh) => {
            if (fresh) {
              setCustomer(fresh as any);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to load customer auth session", e);
    } finally {
      setIsLoading(false);
    }

    // If not logged in and visiting customer storefront, prompt signin
    if (!hasSession && typeof window !== "undefined") {
      const path = window.location.pathname;
      const isInternalPortal =
        path.startsWith("/admin") ||
        path.startsWith("/manager") ||
        path.startsWith("/staff") ||
        path.startsWith("/pos");

      if (!isInternalPortal) {
        const timer = setTimeout(() => {
          setIsAuthModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const openAuthModal = (tab: "login" | "signup" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (phone: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await customerLogin({ phone, password });
      if (res.success && res.customer) {
        setCustomer(res.customer as any);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.customer));
        closeAuthModal();
        return { success: true };
      }
      return { success: false, error: res.error || "Login failed" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Login request error" };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    name: string;
    phone: string;
    password?: string;
    address?: string;
    email?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await customerSignup(data);
      if (res.success && res.customer) {
        setCustomer(res.customer as any);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.customer));
        closeAuthModal();
        return { success: true, message: res.message };
      }
      return { success: false, error: res.error || "Sign-up failed" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Signup request error" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCustomer(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const refreshCustomer = async () => {
    if (!customer?.phone) return;
    try {
      const fresh = await getCustomerProfile(customer.phone);
      if (fresh) {
        setCustomer(fresh as any);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      }
    } catch (e) {
      console.error("Error refreshing customer profile", e);
    }
  };

  const updateProfile = async (data: { name?: string; address?: string; email?: string }) => {
    if (!customer?.id) return false;
    try {
      const res = await updateCustomerProfile(customer.id, data);
      if (res.success && res.customer) {
        setCustomer((prev) => (prev ? { ...prev, ...res.customer } : (res.customer as any)));
        await refreshCustomer();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        logout,
        refreshCustomer,
        updateProfile,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
