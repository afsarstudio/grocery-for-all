export type PortalRole = "admin" | "manager" | "staff";

export const PORTAL_PASSWORDS: Record<PortalRole, string> = {
  admin: "admin12",
  manager: "907890",
  staff: "9078",
};

export const PORTAL_DETAILS: Record<
  PortalRole,
  {
    title: string;
    roleLabel: string;
    subtitle: string;
    href: string;
    themeColor: string;
    badgeBg: string;
    badgeText: string;
    buttonBg: string;
  }
> = {
  admin: {
    title: "Master Admin Dashboard",
    roleLabel: "Admin Access",
    subtitle: "Full supermarket inventory, orders, products & sales control",
    href: "/admin",
    themeColor: "amber",
    badgeBg: "bg-amber-500/20 border-amber-500/40",
    badgeText: "text-amber-300",
    buttonBg: "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold",
  },
  manager: {
    title: "Manager Desk Portal",
    roleLabel: "Manager Access",
    subtitle: "Order dispatch desks, quick stock refills & POS monitoring",
    href: "/manager",
    themeColor: "teal",
    badgeBg: "bg-teal-500/20 border-teal-500/40",
    badgeText: "text-teal-300",
    buttonBg: "bg-teal-600 hover:bg-teal-500 text-white font-bold",
  },
  staff: {
    title: "Staff POS Billing Terminal",
    roleLabel: "Staff POS Access",
    subtitle: "High-speed barcode checkout, counter billing & receipt printing",
    href: "/staff/billing",
    themeColor: "emerald",
    badgeBg: "bg-emerald-500/20 border-emerald-500/40",
    badgeText: "text-emerald-300",
    buttonBg: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold",
  },
};

export function verifyPortalPassword(role: PortalRole, enteredPass: string): boolean {
  const trimmed = (enteredPass || "").trim();
  if (role === "admin") {
    return trimmed === PORTAL_PASSWORDS.admin;
  }
  if (role === "manager") {
    return trimmed === PORTAL_PASSWORDS.manager || trimmed === PORTAL_PASSWORDS.admin;
  }
  if (role === "staff") {
    return (
      trimmed === PORTAL_PASSWORDS.staff ||
      trimmed === PORTAL_PASSWORDS.manager ||
      trimmed === PORTAL_PASSWORDS.admin
    );
  }
  return false;
}

export function isPortalAuthenticated(role: PortalRole): boolean {
  if (typeof window === "undefined") return false;
  try {
    const authKey = `gfa_portal_${role}_auth`;
    if (localStorage.getItem(authKey) === "true" || sessionStorage.getItem(authKey) === "true") {
      return true;
    }
    // Admin password grants access across all
    if (
      localStorage.getItem("gfa_portal_admin_auth") === "true" ||
      sessionStorage.getItem("gfa_portal_admin_auth") === "true"
    ) {
      return true;
    }
    // Manager grants staff
    if (
      role === "staff" &&
      (localStorage.getItem("gfa_portal_manager_auth") === "true" ||
        sessionStorage.getItem("gfa_portal_manager_auth") === "true")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function setPortalAuthenticated(role: PortalRole) {
  if (typeof window === "undefined") return;
  try {
    const authKey = `gfa_portal_${role}_auth`;
    localStorage.setItem(authKey, "true");
    sessionStorage.setItem(authKey, "true");
  } catch {}
}

export function clearPortalAuthentication(role?: PortalRole) {
  if (typeof window === "undefined") return;
  try {
    if (role) {
      localStorage.removeItem(`gfa_portal_${role}_auth`);
      sessionStorage.removeItem(`gfa_portal_${role}_auth`);
    } else {
      localStorage.removeItem("gfa_portal_admin_auth");
      localStorage.removeItem("gfa_portal_manager_auth");
      localStorage.removeItem("gfa_portal_staff_auth");
      sessionStorage.removeItem("gfa_portal_admin_auth");
      sessionStorage.removeItem("gfa_portal_manager_auth");
      sessionStorage.removeItem("gfa_portal_staff_auth");
    }
  } catch {}
}
