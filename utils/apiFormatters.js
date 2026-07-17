import { existsSync } from "fs";
import path from "path";

const absoluteBaseUrl = () =>
  (
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    ""
  ).replace(/\/+$/, "");

const publicAssetExists = (candidatePath) => {
  const localPath = path.join(process.cwd(), "public", candidatePath.replace(/^\/+/, ""));
  return existsSync(localPath);
};

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
};

const asFlag = (value) => (Number(value) === 1 ? 1 : 0);

const uniqueCandidates = (candidates) => [...new Set(candidates.filter(Boolean))];

const pickAssetPath = (value, folder = "") => {
  const rawValue = String(value || "").trim();
  const normalizedFolder = folder ? `/${folder.replace(/^\/+|\/+$/g, "")}` : "";
  const normalizedValue = rawValue.replace(/^public\//, "").replace(/^\/+/, "");

  if (!rawValue) return null;
  if (/^https?:\/\//i.test(rawValue)) return rawValue;

  const filename = normalizedValue.split("/").filter(Boolean).pop() || normalizedValue;
  const candidates = uniqueCandidates([
    normalizedValue.startsWith("storage/app/public/backend/")
      ? `/${normalizedValue.replace(/^storage\/app\/public\//, "")}`
      : null,
    normalizedValue.startsWith("backend/") ? `/${normalizedValue}` : null,
    normalizedValue.startsWith("uploads/") ? `/${normalizedValue}` : null,
    normalizedValue.startsWith("storage/") ? `/${normalizedValue}` : null,
    normalizedFolder ? `${normalizedFolder}/${filename}` : null,
    normalizedFolder && normalizedValue !== filename ? `${normalizedFolder}/${normalizedValue}` : null,
    `/uploads/${filename}`,
    `/uploads/${normalizedValue}`,
    `/${normalizedValue}`,
  ]);

  const existing = candidates.find((candidate) => publicAssetExists(candidate));
  return existing || candidates[0] || null;
};

export const assetUrl = (value, folder = "") => {
  const resolvedPath = pickAssetPath(value, folder);
  if (!resolvedPath) return null;

  const base = absoluteBaseUrl();
  return base ? `${base}${resolvedPath}` : resolvedPath;
};

export const formatBanner = (banner) => ({
  ...banner,
  image_full_url: assetUrl(banner.file_path, "uploads/carousel"),
  mobile_image_full_url: assetUrl(banner.mobile_file_path, "uploads/carousel"),
  image_url: assetUrl(banner.file_path, "uploads/carousel"),
  file_path_full_url: assetUrl(banner.file_path, "uploads/carousel"),
  mobile_file_path_full_url: assetUrl(banner.mobile_file_path, "uploads/carousel"),
});

export const formatOffer = (offer) => ({
  ...offer,
  offer_image_full_url: assetUrl(offer.offer_image || offer.file_path || offer.image, "uploads/offers"),
  offer_image_url: assetUrl(offer.offer_image || offer.file_path || offer.image, "uploads/offers"),
});

export const formatBrand = (brand) => ({
  ...brand,
  image_full_url: assetUrl(brand.image, "uploads/brands"),
  image_url: assetUrl(brand.image, "uploads/brands"),
  logo_full_url: assetUrl(brand.image, "uploads/brands"),
});

export const formatProduct = (product) => ({
  ...product,
  has_variations: asFlag(product.has_variations),
  flash_sale: asFlag(product.flash_sale),
  weekly_offer: asFlag(product.weekly_offer),
  special_offer: asFlag(product.special_offer),
  today_deals: asFlag(product.today_deals),
  status: asFlag(product.status),
  actual_price: asNumber(product.actual_price),
  sell_price: asNumber(product.sell_price),
  discount: asNumber(product.discount),
  available_quantity: asNumber(product.available_quantity),
  stock_quantity: asNumber(product.stock_quantity),
  delivery_target_days: asNumber(product.delivery_target_days),
  image_full_url: assetUrl(product.main_image, "uploads/products"),
  main_image_full_url: assetUrl(product.main_image, "uploads/products"),
  image_url: assetUrl(product.main_image, "uploads/products"),
  main_image_url: assetUrl(product.main_image, "uploads/products"),
  product_catalogue_full_url: assetUrl(product.product_catalogue, "uploads/catalogues"),
  catalogue_full_url: assetUrl(product.product_catalogue, "uploads/catalogues"),
  files_full_url: assetUrl(product.product_catalogue, "uploads/catalogues"),
  product_catalogue_url: assetUrl(product.product_catalogue, "uploads/catalogues"),
  brand: product.brand_id
    ? {
        id: product.brand_id,
      brand_name: product.brand_name,
      image_full_url: assetUrl(product.brand_image, "uploads/brands"),
      image_url: assetUrl(product.brand_image, "uploads/brands"),
        top: asFlag(product.brand_top),
        status: asFlag(product.brand_status),
      }
    : null,
  category: product.category_id
    ? {
        id: product.category_id,
      category_name: product.category_name,
      parent_id: product.category_parent_id,
      image_full_url: assetUrl(product.category_image, "uploads"),
      image_url: assetUrl(product.category_image, "uploads"),
        top: asFlag(product.category_top),
        status: asFlag(product.category_status),
      }
    : null,
});

const formatCategory = (category) => ({
  ...category,
  image_full_url: assetUrl(category.image, "uploads"),
  image_url: assetUrl(category.image, "uploads"),
});

export const formatCategoryRows = (rows) => rows.map(formatCategory);

export const buildCategoryTree = (rows, { onlyActive = true } = {}) => {
  const formattedRows = formatCategoryRows(rows).filter((category) => !onlyActive || Number(category.status) === 1);
  const byId = new Map();
  const tree = [];

  formattedRows.forEach((category) => {
    byId.set(Number(category.id), {
      ...category,
      active_children: [],
      children: [],
    });
  });

  formattedRows.forEach((category) => {
    const node = byId.get(Number(category.id));
    const parentId = category.parent_id == null ? null : Number(category.parent_id);
    const parent = parentId ? byId.get(parentId) : null;

    if (parent) {
      parent.active_children.push(node);
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree;
};

export const shouldReturnFlatCategories = (req) => {
  const url = new URL(req.url);
  const referer = req.headers.get("referer") || "";

  return url.searchParams.get("flat") === "1" || referer.includes("/admin");
};

export const parsePagination = (searchParams, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") || `${defaultLimit}`, 10) || defaultLimit, 1),
    maxLimit,
  );
  const offset = Math.max(Number.parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  return { limit, offset };
};
