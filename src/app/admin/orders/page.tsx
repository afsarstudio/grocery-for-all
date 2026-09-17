import React from "react";
import { getOrders } from "@/lib/actions";
import AdminOrdersClient from "./AdminOrdersClient";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return <AdminOrdersClient initialOrders={orders} />;
}
