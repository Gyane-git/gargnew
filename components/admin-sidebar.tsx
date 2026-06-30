"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronDown, Megaphone, ChevronRight, LayoutDashboard, GraduationCap, Users, FileText, Calendar, Globe, Award, MessageSquare, UserCog, BarChart3, Mail, Phone, BookOpen, DollarSign, CheckCircle, XCircle, Clock, Send, Download, Settings, Shield, HelpCircle, LogOut, Bell, Star, TrendingUp, MapPin, Briefcase, CreditCard, PieChart, UserPlus, Eye, ThumbsUp, Plus, Video } from "lucide-react";

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
      { name: "Add Product", path: "/admin/products/add", icon: Users, count: 1284 },
      { name: "Product-list", path: "/admin/products", icon: UserPlus },
    ],
  },
  {
    icon: FileText,
    label: "Categories",
    path: "#",
    expandable: true,
    children: [
      { name: "Add Category", path: "/admin/categories/add", icon: FileText, count: 847 },
      { name: "Category-list", path: "/admin/categories", icon: Bell, count: 43 },
    ],
  },
  {
    icon: Globe,
    label: "Brands",
    path: "#",
    expandable: true,
    children: [
      { name: "Add Brand", path: "/admin/brands/add", icon: Globe, count: 156 },
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
      { name: "Banner List", path: "/admin/banners", icon: Users, count: 10 },
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
      { name: "Processing-list", path: "/admin/ManageOrder/Processing-list", icon: Clock, count: 28 },
      { name: "Shipping-list", path: "/admin/ManageOrder/Shipping-list", icon: Calendar },
      { name: "Delivered-list", path: "/admin/ManageOrder/Delivered-list", icon: FileText },
      { name: "Cancelled-list", path: "/admin/ManageOrder/Cancelled-list", icon: Video },
      { name: "Return requests-list", path: "/admin/ManageOrder/Return-request-list", icon: XCircle },
    ],
  },
  {
    icon: MessageSquare,
    label: "Manage Clinic Setup",
    path: "#",
    expandable: true,
    children: [
      { name: "Setup Page", path: "/admin/manage-clinical-setup/Setup-page", icon: MessageSquare, count: 43 },
      { name: "Setup Request List", path: "/admin/manage-clinical-setup/Setup-requestList", icon: HelpCircle },
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
      { name: "Add User", path: "/admin/System-user/add-user", icon: Settings },
      { name: "Manage Users Permissions", path: "/admin/System-user/manage-permission", icon: MapPin },
    ],
  },
  {
    icon: Settings,
    label: "Reports ",
    path: "#",
    expandable: true,
    children: [{ name: "CIPS Trasactions Query", path: "/admin/CIPS-transaction-report", icon: Settings }],
  },
  {
    icon: Settings,
    label: "Audit Logs",
    path: "/admin/audit-log",
  },
  {
    icon: Settings,
    label: "Shipping Carriers",
    path: "#",
    expandable: true,
    children: [
      { name: "Add Carrier", path: "/admin/shipping-carriers/add-carriers", icon: Settings },
      { name: "Carrier List", path: "/admin/shipping-carriers/carrier-list", icon: MapPin },
    ],
  },
  {
    icon: Settings,
    label: "Manage addresses",
    path: "#",
    expandable: true,
    children: [
      { name: "Manage Provinces", path: "/admin/manage-address/manage-provinces", icon: Settings },
      { name: "Set City/Shipping", path: "/admin/manage-address/set-city-shipping", icon: MapPin },
      { name: "Set City Zone", path: "/admin/manage-address/set-city-zone", icon: Calendar },
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
      { name: "About Company", path: "/admin/compliance/about-company", icon: Settings },
      { name: "About Us", path: "/admin/compliance/about-us", icon: MapPin },
      { name: "Our Team", path: "/admin/compliance/our-team", icon: Calendar },
      { name: "Terms & Conditions", path: "/admin/compliance/terms-conditions", icon: Mail },
      { name: "Business Registration", path: "/admin/compliance/business-registration", icon: Settings },
      { name: "Medical Certifications", path: "/admin/compliance/medical-certifications", icon: BarChart3 },
      { name: "Return & Refunds Policy", path: "/admin/compliance/return-refund-policy", icon: Settings },
      { name: "Privacy Policy", path: "/admin/compliance/privacy-policy", icon: HelpCircle },
    ],
  },
];

const EducationSidebar = () => {
  const [expandedItems, setExpandedItems] = useState({
    "Student Management": true,
    "Application Processing": true,
  });
  const pathname = usePathname();

  const toggleExpand = (label) => {
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => pathname === path;

  return (
    <aside className="w-64 bg-white h-full border-r border-gray-200 flex flex-col overflow-hidden shadow-sm">
      {/* Logo */}

      {/* Scrollable Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path) && !item.expandable;
          const expanded = expandedItems[item.label];
          const hasNotification = item.children?.some((c) => c.count);

          return (
            <div key={item.label}>
              {/* Parent row */}
              <div onClick={() => item.expandable && toggleExpand(item.label)} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors duration-150 ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                <Link href={item.path === "#" ? "#" : item.path} className="flex items-center gap-3 flex-1 min-w-0" onClick={(e) => item.path === "#" && e.preventDefault()}>
                  <div className="relative shrink-0">
                    <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    {hasNotification && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">{item.label}</span>
                    {item.description && <span className="text-xs text-gray-400 truncate block">{item.description}</span>}
                  </div>
                </Link>

                {item.expandable && <span className="shrink-0 ml-1 text-gray-400">{expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>}
              </div>

              {/* Children */}
              {item.expandable && expanded && item.children && (
                <div className="ml-4 pl-3 border-l border-gray-200 mt-0.5 mb-1 space-y-0.5">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = isActive(child.path);
                    return (
                      <Link key={child.path} href={child.path} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${childActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {ChildIcon && <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${childActive ? "text-blue-500" : "text-gray-400"}`} />}
                          <span className="truncate">{child.name}</span>
                        </div>
                        {child.count && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${childActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{child.count}</span>}
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
