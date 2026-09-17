import React from "react";
import { getOrders } from "@/lib/actions";
import ManagerCashDrawerClient from "./ManagerCashDrawerClient";

export const revalidate = 0;

export const metadata = {
  title: "Cash Drawer & Petty Cash Register | Manager Desk",
  description: "Track physical register cash drawer, petty expenses, note denomination count, and shift handover",
};

export default async function ManagerCashDrawerPage() {
  const orders = await getOrders();

  return <ManagerCashDrawerClient initialOrders={orders as any} />;
}
