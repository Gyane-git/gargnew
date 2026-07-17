const normalizeImageUrl = (value, fallbackFolder = "uploads/products") => {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("storage/app/public/backend/")) return `/${raw.replace(/^storage\/app\/public\//, "")}`;
  if (raw.startsWith("backend/")) return `/${raw}`;
  if (raw.startsWith("storage/app/public/")) return `/${raw.replace(/^storage\/app\/public\//, "")}`;
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("uploads/")) return `/${raw}`;
  if (raw.startsWith("public/")) return `/${raw.replace(/^public\//, "")}`;
  if (raw.includes("/")) return `/${raw.replace(/^\/+/, "")}`;

  return `/${fallbackFolder.replace(/^\/+|\/+$/g, "")}/${raw}`;
};

export const resolveProductImage = (product, fallback = "/assets/logo.png") => {
  const galleryImage = product?.product_images?.[0] || product?.gallery?.[0] || product?.images?.[0] || null;

  const candidates = [
    product?.image_full_url,
    product?.main_image_full_url,
    product?.gallery_image_full_url,
    product?.image_url,
    product?.main_image_url,
    product?.main_image,
    product?.gallery_image_path,
    galleryImage?.image_full_url,
    galleryImage?.image_url,
    galleryImage?.image_path,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeImageUrl(candidate);
    if (resolved) return resolved;
  }

  return fallback;
};

export const resolveCategoryImage = (category, fallback = "/no-image.png") => {
  const candidates = [category?.image_full_url, category?.image_url, category?.image];
  for (const candidate of candidates) {
    const resolved = normalizeImageUrl(candidate, "uploads");
    if (resolved) return resolved;
  }
  return fallback;
};

export const resolveBrandImage = (brand, fallback = "/no-image.png") => {
  const candidates = [brand?.image_full_url, brand?.image_url, brand?.logo_full_url, brand?.image];
  for (const candidate of candidates) {
    const resolved = normalizeImageUrl(candidate, "uploads/brands");
    if (resolved) return resolved;
  }
  return fallback;
};
