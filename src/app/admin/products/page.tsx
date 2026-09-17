import React from "react";
import { getCategories, getProducts } from "@/lib/actions";
import AdminProductsClient from "./AdminProductsClient";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ inStockOnly: false } as any),
  ]);

  return <AdminProductsClient initialProducts={products} categories={categories} />;
}
