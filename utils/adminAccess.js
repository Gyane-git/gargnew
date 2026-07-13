const ADMIN_ONLY_PREFIXES = [
  "/admin/system-users",
  "/admin/system-users/manage-permission",
  "/admin/audit-logs",
];

const ADMIN_MANAGER_PREFIXES = [
  "/admin/orders",
  "/admin/customers",
  "/admin/inquiries",
  "/admin/grievances",
  "/admin/newsletter-subscriber",
  "/admin/reviews-ratings",
  "/admin/manage-clinical-setup",
];

const ADMIN_PREFIXES = [
  "/admin/products",
  "/admin/categories",
  "/admin/brands",
  "/admin/banners",
  "/admin/offer-banners",
  "/admin/shipping-carriers",
  "/admin/set-shipping",
  "/admin/address-zone",
  "/admin/provinces",
  "/admin/compliance",
  "/admin/website",
  "/admin/website-promotion",
  "/admin/poster-card",
  "/admin/profile",
  "/admin/CIPS-transaction-report",
];

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const roleSets = {
  superadmin: ["super admin", "superadmin", "super administrator", "super"],
  admin: ["super admin", "superadmin", "super administrator", "admin"],
  manager: ["super admin", "superadmin", "super administrator", "admin", "manager"],
  staff: ["super admin", "superadmin", "super administrator", "admin", "manager", "staff"],
};

const matchesPrefix = (pathname, prefixes) => prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const canAccessAdminPath = (pathname, role) => {
  const currentPath = String(pathname || "");
  const normalizedRole = normalizeRole(role);

  if (currentPath === "/admin/login") {
    return true;
  }

  if (matchesPrefix(currentPath, ADMIN_ONLY_PREFIXES)) {
    return roleSets.superadmin.includes(normalizedRole);
  }

  if (matchesPrefix(currentPath, ADMIN_MANAGER_PREFIXES)) {
    return roleSets.manager.includes(normalizedRole);
  }

  if (matchesPrefix(currentPath, ADMIN_PREFIXES)) {
    return roleSets.admin.includes(normalizedRole);
  }

  return roleSets.staff.includes(normalizedRole);
};

export const getAdminLandingPath = (role) => {
  const normalizedRole = normalizeRole(role);
  if (roleSets.superadmin.includes(normalizedRole)) return "/admin/dashboard";
  if (roleSets.admin.includes(normalizedRole)) return "/admin/dashboard";
  if (roleSets.manager.includes(normalizedRole)) return "/admin/dashboard";
  return "/admin/dashboard";
};

