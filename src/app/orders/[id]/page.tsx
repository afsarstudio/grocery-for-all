import React from "react";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/actions";
import OrderTrackingClient from "./OrderTrackingClient";

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderTrackingClient initialOrder={order as any} />;
}
