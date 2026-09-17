import React from "react";
import Link from "next/link";
import AdminSidebar from "./AdminSidebar";
import PortalAuthGuard from "@/components/auth/PortalAuthGuard";

export const metadata = {
  title: "Admin Dashboard | Grocery for All Super Market",
  description: "Supermarket inventory, orders, products and sales management",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalAuthGuard role="admin">
      <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-900">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </PortalAuthGuard>
  );
}
