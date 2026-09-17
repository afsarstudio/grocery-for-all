import React from "react";
import { getProducts, getCategories } from "@/lib/actions";
import ManagerInventoryClient from "./ManagerInventoryClient";

export const revalidate = 0;

export default async function ManagerInventoryPage() {
  const [products, categories] = await Promise.all([
    getProducts({ inStockOnly: false } as any),
    getCategories(),
  ]);

  return (
    <ManagerInventoryClient
      initialProducts={products as any}
      categories={categories as any}
    />
  );
}
