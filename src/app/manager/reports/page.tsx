import React from "react";
import { getOrders } from "@/lib/actions";
import ManagerReportsClient from "./ManagerReportsClient";

export const revalidate = 0;

export default async function ManagerReportsPage() {
  const orders = await getOrders();
  return <ManagerReportsClient orders={orders as any} />;
}
