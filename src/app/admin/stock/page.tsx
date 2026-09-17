import React from "react";
import prisma from "@/lib/prisma";
import { getProducts, getCategories } from "@/lib/actions";
import AdminStockClient from "./AdminStockClient";

export const revalidate = 0;

export default async function AdminStockPage() {
  const [products, logs, categories] = await Promise.all([
    getProducts({ inStockOnly: false } as any),
    prisma.inventoryLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    getCategories(),
  ]);

  return (
    <AdminStockClient
      initialProducts={products}
      initialLogs={logs}
      categories={categories}
    />
  );
}
