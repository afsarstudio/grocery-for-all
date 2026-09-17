import React from "react";
import { redirect } from "next/navigation";

export default function POSRedirectPage() {
  redirect("/staff/billing");
}
