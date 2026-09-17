import React from "react";
import ManagerBroadcastClient from "./ManagerBroadcastClient";

export const revalidate = 0;

export const metadata = {
  title: "Store Notice & Live Broadcast Desk | Manager Desk",
  description: "Publish live announcements, weather delivery alerts, and flash promo banners on storefront",
};

export default function ManagerBroadcastPage() {
  return <ManagerBroadcastClient />;
}
