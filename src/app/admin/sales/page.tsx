import React from "react";
import prisma from "@/lib/prisma";
import AdminSalesClient from "./AdminSalesClient";

export const revalidate = 0;

export default async function AdminSalesPage() {
  const [orders, products, categories] = await Promise.all([
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      include: { category: true },
    }),
    prisma.category.findMany(),
  ]);

  const totalRevenue = orders.reduce(
    (sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum),
    0
  );
  const totalItemsSold = orders.reduce(
    (sum, o) =>
      o.status !== "CANCELLED"
        ? sum + o.items.reduce((s, i) => s + i.quantity, 0)
        : sum,
    0
  );
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <AdminSalesClient
      orders={orders as any}
      products={products as any}
      categories={categories as any}
      totalRevenue={totalRevenue}
      totalItemsSold={totalItemsSold}
      averageOrderValue={averageOrderValue}
    />
  );
}
