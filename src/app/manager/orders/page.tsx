import React from "react";
import { getOrders } from "@/lib/actions";
import ManagerOrdersClient from "./ManagerOrdersClient";

export const revalidate = 0;

export default async function ManagerOrdersPage() {
  const orders = await getOrders();
  return <ManagerOrdersClient initialOrders={orders as any} />;
}
