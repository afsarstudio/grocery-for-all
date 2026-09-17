import React from "react";
import ManagerSidebar from "./ManagerSidebar";
import PortalAuthGuard from "@/components/auth/PortalAuthGuard";

export const metadata = {
  title: "Store Manager Portal | Grocery for All",
  description: "Live store ops, dispatch control, inventory quick restock, and POS counter monitoring",
};

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalAuthGuard role="manager">
      <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
        <ManagerSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-900">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </PortalAuthGuard>
  );
}
