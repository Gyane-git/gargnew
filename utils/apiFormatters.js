const absoluteBaseUrl = () =>
  (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_NEXTAUTH_URL ||
    process.env.NEXTAUTH_URL ||
    ""
  ).replace(/\/+$/, "");

export const assetUrl = (value, folder = "") => {
  if (!value) return null;

  const rawValue = String(value).trim();
  if (!rawValue) return null;
  if (/^https?:\/\//i.test(rawValue)) return rawValue;

  const base = absoluteBaseUrl();
  const normalizedFolder = folder ? `/${folder.replace(/^\/+|\/+$/g, "")}` : "";
  const normalizedValue = rawValue.replace(/^public\//, "").replace(/^\/+/, "");

  let path;
  if (normalizedValue.startsWith("uploads/")) {
    path = `/${normalizedValue}`;
  } else if (normalizedValue.startsWith("storage/")) {
    path = `/${normalizedValue}`;
  } else {
    path = `${normalizedFolder}/${normalizedValue}`.replace(/\/+/g, "/");
  }

  return base ? `${base}${path}` : path;
};

export const formatBanner = (banner) => ({
  ...banner,
  image_full_url: assetUrl(banner.file_path, "uploads/carousel"),
  mobile_image_full_url: assetUrl(banner.mobile_file_path, "uploads/carousel"),
});

export const formatBrand = (brand) => ({
  ...brand,
  image_full_url: assetUrl(brand.image, "uploads/brands"),
});

export const formatProduct = (product) => ({
  ...product,
  image_full_url: assetUrl(product.main_image, "uploads/products"),
  main_image_full_url: assetUrl(product.main_image, "uploads/products"),
  product_catalogue_full_url: assetUrl(product.product_catalogue, "uploads/catalogues"),
  brand: product.brand_id
    ? {
        id: product.brand_id,
        brand_name: product.brand_name,
        image_full_url: assetUrl(product.brand_image, "uploads/brands"),
        top: product.brand_top,
        status: product.brand_status,
      }
    : null,
  category: product.category_id
    ? {
        id: product.category_id,
        category_name: product.category_name,
        parent_id: product.category_parent_id,
        image_full_url: assetUrl(product.category_image, "uploads"),
        top: product.category_top,
        status: product.category_status,
      }
    : null,
});

const formatCategory = (category) => ({
  ...category,
  image_full_url: assetUrl(category.image, "uploads"),
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
