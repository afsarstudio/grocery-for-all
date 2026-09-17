import React from "react";
import { getOrders } from "@/lib/actions";
import ManagerDispatchClient from "./ManagerDispatchClient";

export const revalidate = 0;

export const metadata = {
  title: "Delivery Boy & Rider Dispatch Hub | Manager Desk",
  description: "Assign store delivery boys, generate WhatsApp delivery slips, and track dispatch status",
};

export default async function ManagerDispatchPage() {
  const orders = await getOrders();

  return <ManagerDispatchClient initialOrders={orders as any} />;
}
