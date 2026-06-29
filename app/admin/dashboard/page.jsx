"use client";

import { useEffect, useState } from "react";
import { ImageIcon, ShoppingBag, Tag, LayoutDashboard, TrendingUp, Eye, CheckCircle, XCircle, ArrowUpRight, Layers, Users, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

// ── STAT CARD CONFIG ──────────────────────────────────────────────
const statCards = [
  {
    label: "Products",
    key: "totalProducts",
    icon: ShoppingBag,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    href: "/admin/products",
  },
  {
    label: "Brands",
    key: "totalBrands",
    icon: Bookmark,
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
    href: "/admin/brands",
  },
  {
    label: "Categories",
    key: "totalCategories",
    icon: Layers,
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
    href: "/admin/categories",
  },
  {
    label: "Customers",
    key: "totalCustomers",
    icon: Users,
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
    href: "/admin/customers",
  },
  {
    label: "Total Banners",
    key: "totalBanners",
    icon: ImageIcon,
    color: "bg-sky-50 text-sky-600",
    border: "border-sky-100",
    href: "/admin/banners",
  },
  {
    label: "Offer Banners",
    key: "offerBanners",
    icon: Tag,
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    href: "/admin/offer-banners",
  },
  {
    label: "Active Banners",
    key: "activeBanners",
    icon: CheckCircle,
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-100",
    href: "/admin/banners",
  },
  {
    label: "Inactive Banners",
    key: "inactiveBanners",
    icon: XCircle,
    color: "bg-gray-50 text-gray-500",
    border: "border-gray-100",
    href: "/admin/banners",
  },
  {
    label: "Inqueries",
    key: "totalInquiries",
    icon: XCircle,
    color: "bg-gray-50 text-gray-500",
    border: "border-gray-100",
    href: "/admin/inquiries",
  },
];

// ── QUICK LINKS ───────────────────────────────────────────────────
const quickLinks = [
  { label: "Products", desc: "Manage your product catalog", href: "/admin/products", icon: ShoppingBag, accent: "bg-blue-600" },
  { label: "Brands", desc: "Add and update brands", href: "/admin/brands", icon: Bookmark, accent: "bg-violet-600" },
  { label: "Categories", desc: "Organise product categories", href: "/admin/categories", icon: Layers, accent: "bg-amber-500" },
  { label: "Customers", desc: "View and manage customers", href: "/admin/customers", icon: Users, accent: "bg-emerald-600" },
  { label: "Banners", desc: "Carousel banner management", href: "/admin/banners", icon: ImageIcon, accent: "bg-sky-600" },
  { label: "Offer Banners", desc: "Manage promotional banners", href: "/admin/offer-banners", icon: Tag, accent: "bg-rose-500" },
  { label: "Inquiries", desc: "Manage customer inquiries", href: "/admin/inquiries", icon: Tag, accent: "bg-rose-500" },
];

// ── SKELETON ──────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <span className={`inline-block bg-gray-100 rounded animate-pulse ${className}`} />;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    totalCustomers: 0,
    totalBanners: 0,
    offerBanners: 0,
    activeBanners: 0,
    inactiveBanners: 0,
    totalInquiries: 0,
  });
  const [recentBanners, setRecentBanners] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bannersRes, productsRes, brandsRes, categoriesRes, customersRes, inquiriesRes] = await Promise.allSettled([
          fetch("/api/v1/banners").then((r) => r.json()),
          fetch("/api/v1/products").then((r) => r.json()),
          fetch("/api/v1/brands").then((r) => r.json()),
          fetch("/api/v1/categories").then((r) => r.json()),
          fetch("/api/v1/customers").then((r) => r.json()),
          fetch("/api/v1/inquiries").then((r) => r.json()),
        ]);

        const banners = bannersRes.status === "fulfilled" && bannersRes.value.success ? bannersRes.value.banners : [];
        const products = productsRes.status === "fulfilled" && productsRes.value.success ? productsRes.value.products : [];
        const brands = brandsRes.status === "fulfilled" && brandsRes.value.success ? brandsRes.value.brands : [];
        const categories = categoriesRes.status === "fulfilled" && categoriesRes.value.success ? categoriesRes.value.categories : [];
        const customers = customersRes.status === "fulfilled" && customersRes.value.success ? customersRes.value.customers : [];
        const inquiries = inquiriesRes.status === "fulfilled" && inquiriesRes.value.success ? inquiriesRes.value.inquiries : [];

        setStats({
          totalProducts: products.length,
          totalBrands: brands.length,
          totalCategories: categories.length,
          totalCustomers: customers.length,
          totalBanners: banners.length,
          offerBanners: banners.filter((b) => b.is_offer === 1).length,
          activeBanners: banners.filter((b) => b.status === 1).length,
          inactiveBanners: banners.filter((b) => b.status !== 1).length,
          totalInquiries: inquiries.length,
        });

        setRecentBanners(banners.slice(0, 5));
        setRecentProducts(products.slice(0, 5));
        setRecentCustomers(customers.slice(0, 5));
        setRecentInquiries(inquiries.slice(0, 10));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const getBannerImage = (b) => {
    if (b.file_path) return b.file_path.startsWith("http") ? b.file_path : `/uploads/carousel/${b.file_path}`;
    if (b.mobile_file_path) return `/uploads/carousel/${b.mobile_file_path}`;
    return "/no-imag.png";
  };

  const getProductImage = (p) => {
    if (p.image) return p.image.startsWith("http") ? p.image : `/uploads/products/${p.image}`;
    return "/no-image.png";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a3a6b] flex items-center justify-center shadow">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a3a6b] leading-tight">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Online
        </div>
      </div>

      {/* ── STAT CARDS (2 cols mobile / 4 cols desktop) ──────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, key, icon: Icon, color, border, href }) => (
          <button key={key} onClick={() => router.push(href)} className={`bg-white rounded-2xl border ${border} p-5 shadow-sm flex flex-col gap-3 text-left hover:shadow-md transition-shadow group`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">{label}</span>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={15} />
              </span>
            </div>
            <div className="text-3xl font-bold text-[#1a3a6b]">{loading ? <Skeleton className="w-10 h-7" /> : stats[key]}</div>
            <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
              <ArrowUpRight size={11} /> View all
            </div>
          </button>
        ))}
      </div>

      {/* ── RECENT TABLES + QUICK ACTIONS ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Recent Banners & Recent Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Banners */}
          <RecentTable title="Recent Banners" href="/admin/banners" loading={loading} empty={recentBanners.length === 0} emptyText="No banners yet" router={router}>
            {recentBanners.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={getBannerImage(b)} alt={b.product_code} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">{b.product_code}</p>
                  <p className="text-xs text-gray-400 font-mono">#{b.id}</p>
                </td>
                <td className="px-3 py-3">{b.is_offer === 1 && <Badge color="amber">OFFER</Badge>}</td>
                <td className="px-3 py-3">
                  <Badge color={b.status === 1 ? "emerald" : "gray"}>{b.status === 1 ? "ACTIVE" : "INACTIVE"}</Badge>
                </td>
              </tr>
            ))}
          </RecentTable>

          {/* Recent Products */}
          <RecentTable title="Recent Products" href="/admin/products" loading={loading} empty={recentProducts.length === 0} emptyText="No products yet" router={router}>
            {recentProducts.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{p.name}</p>
                  <p className="text-xs text-gray-400 font-mono">#{p.id}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm font-semibold text-[#1a3a6b]">{p.price ? `Rs. ${Number(p.price).toLocaleString()}` : "—"}</p>
                </td>
                <td className="px-3 py-3">
                  <Badge color={p.status === 1 ? "emerald" : "gray"}>{p.status === 1 ? "ACTIVE" : "INACTIVE"}</Badge>
                </td>
              </tr>
            ))}
          </RecentTable>
        </div>

        {/* RIGHT: Quick Actions + Customers + Overview */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#1a3a6b] text-sm">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-2">
              {quickLinks.map(({ label, desc, href, icon: Icon, accent }) => (
                <button key={href} onClick={() => router.push(href)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-slate-50 transition-all text-left group">
                  <div className={`w-8 h-8 rounded-xl ${accent} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 truncate">{desc}</p>
                  </div>
                  <ArrowUpRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Overview Progress */}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1a3a6b] text-sm">Recent Customers</h2>
            <button onClick={() => router.push("/admin/customers")} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-36" />
                  </div>
                </div>
              ))
            ) : recentCustomers.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No customers yet</p>
            ) : (
              recentCustomers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  {/* Avatar initials */}
                  <div className="w-8 h-8 rounded-full bg-[#1a3a6b] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{(c.name || c.full_name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name || c.full_name || "Unknown"}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email || "—"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Inqueries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1a3a6b] text-sm">Recent Inqueries</h2>
            <button onClick={() => router.push("/admin/inquiries")} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-36" />
                  </div>
                </div>
              ))
            ) : recentCustomers.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No customers yet</p>
            ) : (
              recentCustomers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  {/* Avatar initials */}
                  <div className="w-8 h-8 rounded-full bg-[#1a3a6b] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{(c.name || c.full_name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name || c.full_name || "Unknown"}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email || "—"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="bg-[#1a3a6b] rounded-2xl p-5 shadow-sm text-white">
        <div className="flex items-center gap-2 mb-5">
          <Eye size={14} className="text-blue-300" />
          <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Store Overview</span>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[60, 80, 45, 70].map((w, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-2 w-20 bg-white/10" />
                <div className="h-1.5 bg-white/10 rounded-full" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: "Products", value: stats.totalProducts, max: Math.max(stats.totalProducts, 1), color: "bg-blue-400" },
              { label: "Customers", value: stats.totalCustomers, max: Math.max(stats.totalCustomers, 1), color: "bg-emerald-400" },
              { label: "Brands", value: stats.totalBrands, max: Math.max(stats.totalBrands, 1), color: "bg-violet-400" },
              { label: "Categories", value: stats.totalCategories, max: Math.max(stats.totalCategories, 1), color: "bg-amber-400" },
              { label: "Active Banners", value: stats.activeBanners, max: Math.max(stats.totalBanners, 1), color: "bg-teal-400" },
            ].map(({ label, value, max, color }) => {
              const pct = Math.round((value / max) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-blue-200">{label}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-blue-300 mt-5 border-t border-white/10 pt-4">
          {stats.totalProducts} products · {stats.totalCustomers} customers · {stats.totalBrands} brands
        </p>
      </div>
    </div>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────

function Badge({ color = "gray", children }) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    gray: "bg-gray-100 text-gray-400 border-gray-200",
    rose: "bg-rose-50 text-rose-500 border-rose-100",
  };
  return <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${map[color]}`}>{children}</span>;
}

function RecentTable({ title, href, loading, empty, emptyText, children, router }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-[#1a3a6b] text-sm">{title}</h2>
        <button onClick={() => router.push(href)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold">
          View all <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-0 divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : empty ? (
          <p className="text-center text-sm text-gray-400 py-10">{emptyText}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>{children}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
