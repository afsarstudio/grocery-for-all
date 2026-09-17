import React from "react";
import { getCustomers } from "@/lib/actions";
import AdminCustomersClient from "./AdminCustomersClient";

export const revalidate = 0;

export default async function AdminCustomersPage() {
  const customers = await getCustomers();
  return <AdminCustomersClient initialCustomers={customers} />;
}
