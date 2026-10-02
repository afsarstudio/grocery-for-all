import React from "react";
import { getProducts, getCategories } from "@/lib/actions";
import { mockDb } from "@/lib/mockStore";
import AdminStockClient from "./AdminStockClient";

export const revalidate = 0;

export default async function AdminStockPage() {
  const [products, categories] = await Promise.all([
    getProducts({ inStockOnly: false } as any),
    getCategories(),
  ]);

  const logs = [...mockDb.inventoryLogs].slice(0, 20);

  return (
    <AdminStockClient
      initialProducts={products}
      initialLogs={logs as any}
      categories={categories}
    />
  );
}
