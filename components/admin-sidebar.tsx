"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAccessAdminPath } from "@/utils/adminAccess";

import {
  ChevronDown,
  Megaphone,
  ChevronRight,
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  Calendar,
  Globe,
  Award,
  MessageSquare,
  UserCog,
  BarChart3,
  Mail,
  Phone,
  BookOpen,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Download,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  Bell,
  Star,
  TrendingUp,
  MapPin,
  Briefcase,
  CreditCard,
  PieChart,
  UserPlus,
  Eye,
  ThumbsUp,
  Plus,
  Video,
} from "lucide-react";

type SidebarChildItem = {
  name: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
};

type SidebarItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  description?: string;
  expandable?: boolean;
  children?: SidebarChildItem[];
};

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/admin/dashboard",
    description: "Overview & Analytics",
  },

  {
    icon: GraduationCap,
    label: "Products",
    path: "#",
    expandable: true,
    children: [
      {
        name: "Add Product",
        path: "/admin/products/add",
        icon: Users,
        
      },
      { name: "Product-list", path: "/admin/products", icon: UserPlus, },
    ],
  },
  {
    icon: FileText,
    label: "Categories",
    path: "#",
    expandable: true,
    children: [
      {
        name: "Add Category",
        path: "/admin/categories/add",
        icon: FileText,
        
      },
      {
        name: "Category-list",
        path: "/admin/categories",
        icon: Bell,
        
      },
    ],
  },
  {
    icon: Globe,
    label: "Brands",
    path: "#",
    expandable: true,
    children: [
      { name: "Add Brand", path: "/admin/brands/add", icon: Globe, },
      { name: "Brand-list", path: "/admin/brands", icon: Plus },
    ],
  },
  {
    icon: Megaphone,
    label: "Banners",
    path: "#",
    expandable: true,
    children: [
      { name: "Add-Banner", path: "/admin/banners/add", icon: Users },
      { name: "Banner List", path: "/admin/banners", icon: Users, },
    ],
  },
  {
    icon: Award,
    label: "Offers",
    path: "/admin/offer-banners",
  },
  {
    icon: Calendar,
    label: "Manage Orders",
    path: "#",
    expandable: true,
    children: [
      {
        name: "Processing-list",
        path: "/admin/orders/processing",
        icon: Clock,
        
      },
      { name: "Shipping-list", path: "/admin/orders/shipped", icon: Calendar },
      {
        name: "Delivered-list",
        path: "/admin/orders/delivered",
        icon: FileText,
      },
      { name: "Cancelled-list", path: "/admin/orders/cancelled", icon: Video },
      {
        name: "Return requests-list",
        path: "/admin/orders/returned",
        icon: XCircle,
      },
    ],
  },
  {
    icon: MessageSquare,
    label: "Manage Clinic Setup",
    path: "#",
    expandable: true,
    children: [
      {
        name: "Setup Page",
        path: "/admin/manage-clinical-setup/Setup-page",
        icon: MessageSquare,
        
      },
      {
        name: "Setup Request List",
        path: "/admin/manage-clinical-setup/Setup-requestList",
        icon: HelpCircle,
      },
    ],
  },
  {
    icon: BarChart3,
    label: "Customers",
    path: "/admin/customers",
  },
  {
    icon: UserCog,
    label: "Reviews & Ratings",
    path: "/admin/reviews-ratings",
  },
  {
    icon: Briefcase,
    label: "Inquiries",
    path: "/admin/inquiries",
  },
  {
    icon: DollarSign,
    label: "Grievances",
    path: "/admin/grievances",
  },
  {
    icon: Mail,
    label: "Newsletters subscribers",
    path: "/admin/newsletter-subscriber",
  },

  {
    icon: Settings,
    label: "System Users",
    path: "#",
    expandable: true,
    children: [
      { name: "Add User", path: "/admin/system-users", icon: Settings },
      {
        name: "Manage Users Permissions",
        path: "/admin/system-users/manage-permission",
        icon: MapPin,
      },
    ],
  },
  {
    icon: Settings,
    label: "Reports ",
    path: "#",
    expandable: true,
    children: [
      {
        name: "CIPS Trasactions Query",
        path: "/admin/CIPS-transaction-report",
        icon: Settings,
      },
    ],
  },
  {
    icon: Settings,
    label: "Audit Logs",
    path: "/admin/audit-logs",
  },
  {
    icon: Settings,
    label: "Shipping Carriers",
    path: "#",
    expandable: true,
    children: [
      {
        name: "Add Carrier",
        path: "/admin/shipping-carriers/add-carriers",
        icon: Settings,
      },
      {
        name: "Carrier List",
        path: "/admin/shipping-carriers/carrier-list",
        icon: MapPin,
      },
    ],
  },
  {
    icon: Settings,
    label: "Manage addresses",
    path: "#",
    expandable: true,
    children: [
      { name: "Manage Provinces", path: "/admin/provinces", icon: Settings },
      { name: "Set City Zone", path: "/admin/address-zone", icon: Calendar },
      { name: "Set City/Shipping", path: "/admin/set-shipping", icon: MapPin },
    ],
  },
  {
    icon: Settings,
    label: "Return & Cancellation Reasons",
    path: "/admin/return-cancell-reasons",
  },
  {
    icon: Settings,
    label: "Compliance & Legality",
    path: "#",
    expandable: true,
    children: [
      {
        name: "About Company",
        path: "/admin/compliance/about-company",
        icon: Settings,
      },
      { name: "About Us", path: "/admin/compliance/about-us", icon: MapPin },
      { name: "Our Team", path: "/admin/compliance/our-team", icon: Calendar },
      {
        name: "Terms & Conditions",
        path: "/admin/compliance/terms-conditions",
        icon: Mail,
      },
      {
        name: "Business Registration",
        path: "/admin/compliance/business-registration",
        icon: Settings,
      },
      {
        name: "Medical Certifications",
        path: "/admin/compliance/medical-certifications",
        icon: BarChart3,
      },
      {
        name: "Return & Refunds Policy",
        path: "/admin/compliance/return-refund-policy",
        icon: Settings,
      },
      {
        name: "Privacy Policy",
        path: "/admin/compliance/privacy-policy",
        icon: HelpCircle,
      },
    ],
  },
];

const EducationSidebar = ({ adminRole = "" }) => {
  const [expandedItems, setExpandedItems] = useState({
    "Student Management": true,
    "Application Processing": true,
  });
  const pathname = usePathname();

  const toggleExpand = (label) => {
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => pathname === path;
  const canShowItem = (item: SidebarItem) => {
    if (item.expandable && item.children) {
      return item.children.some((child) =>
        canAccessAdminPath(child.path, adminRole),
      );
    }

    return canAccessAdminPath(item.path, adminRole);
  };

  return (
    <aside className="w-64 bg-white h-full border-r border-gray-200 flex flex-col overflow-hidden shadow-sm">
      {/* Logo */}

      {/* Scrollable Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2 mb-10 border-b-1">
        {menuItems.filter(canShowItem).map((item: SidebarItem) => {
          const Icon = item.icon;
          const active = isActive(item.path) && !item.expandable;
          const expanded = expandedItems[item.label];
          const visibleChildren = item.children?.filter((child) =>
            canAccessAdminPath(child.path, adminRole),
          );
          const hasNotification = visibleChildren?.some((c) => c.count);

          return (
            <div key={item.label}>
              {/* Parent row */}
              <div
                onClick={() => item.expandable && toggleExpand(item.label)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors duration-150 ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                <Link
                  href={item.path === "#" ? "#" : item.path}
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={(e) => item.path === "#" && e.preventDefault()}
                >
                  <div className="relative shrink-0">
                    <Icon
                      className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
                    />
                    {hasNotification && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-xs text-gray-400 truncate block">
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>

                {item.expandable && (
                  <span className="shrink-0 ml-1 text-gray-400">
                    {expanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                )}
              </div>

              {/* Children */}
              {item.expandable &&
                expanded &&
                visibleChildren &&
                visibleChildren.length > 0 && (
                  <div className="ml-4 pl-3 border-l border-gray-200 mt-0.5 mb-1 space-y-0.5">
                    {visibleChildren.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${childActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {ChildIcon && (
                              <ChildIcon
                                className={`w-3.5 h-3.5 shrink-0 ${childActive ? "text-blue-500" : "text-gray-400"}`}
                              />
                            )}
                            <span className="truncate">{child.name}</span>
                          </div>
                          {child.count && (
                            <span
                              className={`text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${childActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {child.count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default EducationSidebar;
