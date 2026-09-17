import React from "react";
import { Metadata } from "next";
import { getCategories, getProducts, getPOSCounterStats } from "@/lib/actions";
import StaffPOSClient from "./StaffPOSClient";

export const metadata: Metadata = {
  title: "Staff POS Billing Counter | Grocery for All",
  description: "Fast Point of Sale and supermarket checkout counter for Grocery for All staff.",
};

export const revalidate = 0; // Always fresh for cashier counter

export default async function StaffBillingPage() {
  const [categories, products, counterStats] = await Promise.all([
    getCategories(),
    getProducts({ inStockOnly: false } as any),
    getPOSCounterStats(),
  ]);

  return (
    <StaffPOSClient
      initialProducts={products}
      categories={categories}
      initialStats={counterStats}
    />
  );
}
