import React from "react";
import { getCustomers } from "@/lib/actions";
import ManagerCustomersClient from "./ManagerCustomersClient";

export const revalidate = 0;

export default async function ManagerCustomersPage() {
  const customers = await getCustomers();
  return <ManagerCustomersClient initialCustomers={customers as any} />;
}
