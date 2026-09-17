import React from "react";
import { getManagerOverviewData } from "@/lib/actions";
import ManagerOverviewClient from "./ManagerOverviewClient";

export const revalidate = 0;

export default async function ManagerDashboardPage() {
  const data = await getManagerOverviewData();

  return (
    <ManagerOverviewClient
      initialKpis={
        data?.kpis || {
          totalProducts: 0,
          totalOrders: 0,
          customersCount: 0,
          lowStockProducts: 0,
          totalRevenue: 0,
          pendingOrdersCount: 0,
        }
      }
      initialOrders={(data?.orders || []) as any}
      initialUrgentLowStock={(data?.urgentLowStock || []) as any}
      initialCashTotal={data?.cashTotal || 0}
      initialUpiTotal={data?.upiTotal || 0}
    />
  );
}
