import React from "react";
import { getOrders } from "@/lib/actions";
import ManagerPOSMonitorClient from "./ManagerPOSMonitorClient";

export const revalidate = 0;

export default async function ManagerPOSPage() {
  const orders = await getOrders();
  return <ManagerPOSMonitorClient initialOrders={orders as any} />;
}
