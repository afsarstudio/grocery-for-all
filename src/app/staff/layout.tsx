import React from "react";
import { Metadata } from "next";
import PortalAuthGuard from "@/components/auth/PortalAuthGuard";

export const metadata: Metadata = {
  title: "Staff POS Billing Terminal | Grocery for All",
  description: "Point of Sale & Counter Cashier Checkout Terminal for store staff",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalAuthGuard role="staff">{children}</PortalAuthGuard>;
}
