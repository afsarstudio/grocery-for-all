import React, { Suspense } from "react";
import { getCategories, getProducts } from "@/lib/actions";
import ProductsClientView from "./ProductsClientView";

export const revalidate = 0;

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-slate-500 text-sm">
          Loading supermarket catalog...
        </div>
      }
    >
      <ProductsClientView initialProducts={products} categories={categories} />
    </Suspense>
  );
}
