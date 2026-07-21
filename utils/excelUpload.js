import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { mkdir, readdir, stat } from "fs/promises";

export const IMAGE_UPLOAD_ROOT = path.join(process.cwd(), "public", "images", "uploads");

export const PRODUCT_TEMPLATE_HEADERS = [
  "product_name",
  "category_id",
  "delivery_target_days",
  "brand_id",
  "actual_price",
  "sell_price",
  "available_quantity",
  "stock_quantity",
];

export const generateProductCode = async (connection) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `P${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
    const [rows] = await connection.query("SELECT id FROM products WHERE product_code = ? LIMIT 1", [code]);
    if (!rows.length) return code;
  }

  throw new Error("Unable to generate a unique product code.");
};

export const IMAGE_TEMPLATE_HEADERS = ["product_code", "product_name", "main_image", "image_1", "image_2", "image_3", "image_4", "image_5"];

export const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const toNumberOrZero = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const toBoolInt = (value) => {
  if (value === true || value === 1 || value === "1" || String(value).toLowerCase() === "yes") return 1;
  return 0;
};

export const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const pickRowValue = (row, keys = []) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

export const parseIdValue = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const id = Number(match[0]);
  return Number.isFinite(id) ? id : null;
};

export const resolveCategoryId = async (connection, row) => {
  const directId = parseIdValue(
    pickRowValue(row, ["category_id", "categoryid", "category", "cat_id", "catid"]),
  );
  if (directId) return directId;

  const categoryName = String(
    pickRowValue(row, ["category_name", "categoryname", "category_title", "categorytitle"]),
  ).trim();
  if (!categoryName) return null;

  const [rows] = await connection.query(
    "SELECT id FROM categories WHERE TRIM(category_name) = ? LIMIT 1",
    [categoryName],
  );
  if (rows.length) return Number(rows[0].id);

  const [fuzzyRows] = await connection.query(
    "SELECT id FROM categories WHERE LOWER(TRIM(category_name)) = LOWER(?) LIMIT 1",
    [categoryName],
  );
  return fuzzyRows.length ? Number(fuzzyRows[0].id) : null;
};

export const resolveBrandId = async (connection, row) => {
  const directId = parseIdValue(pickRowValue(row, ["brand_id", "brandid", "brand", "brand_code"]));
  if (directId) return directId;

  const brandName = String(pickRowValue(row, ["brand_name", "brandname", "brand_title"])).trim();
  if (!brandName) return null;

  const [rows] = await connection.query(
    "SELECT id FROM brands WHERE TRIM(brand_name) = ? LIMIT 1",
    [brandName],
  );
  if (rows.length) return Number(rows[0].id);

  const [fuzzyRows] = await connection.query(
    "SELECT id FROM brands WHERE LOWER(TRIM(brand_name)) = LOWER(?) LIMIT 1",
    [brandName],
  );
  return fuzzyRows.length ? Number(fuzzyRows[0].id) : null;
};

export const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows.map((row) => {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[normalizeHeader(key)] = typeof value === "string" ? value.trim() : value;
    });
    return normalized;
  });
};

export const buildWorkbookBuffer = (sheetName, headers, rows = []) => {
  const workbook = XLSX.utils.book_new();
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const excelDownloadResponse = (buffer, filename) =>
  new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });

export const normalizeImagePath = (value) => {
  if (value === null || value === undefined || value === "") return null;
  let raw = String(value).trim().replace(/^["']|["']$/g, "").replace(/\\/g, "/");
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      raw = decodeURIComponent(url.pathname);
    } catch {
      return raw;
    }
  }

  raw = raw.replace(/^public\//, "");
  if (!raw.startsWith("/")) raw = `/${raw}`;
  return raw.replace(/\/+/g, "/");
};

export const collectGalleryPathsFromRow = (row) => {
  const paths = [];

  for (let i = 1; i <= 10; i++) {
    const value = pickRowValue(row, [
      `image_${i}`,
      `image${i}`,
      `gallery_${i}`,
      `gallery${i}`,
      `img_${i}`,
      `img${i}`,
    ]);
    const normalized = normalizeImagePath(value);
    if (normalized && !paths.includes(normalized)) paths.push(normalized);
  }

  Object.keys(row).forEach((key) => {
    if (key === "main_image") return;
    if (!/^(image|gallery|img)_?\d+$/i.test(key)) return;
    const normalized = normalizeImagePath(row[key]);
    if (normalized && !paths.includes(normalized)) paths.push(normalized);
  });

  return paths;
};

export const collectImagePathsFromRow = (row) => {
  const paths = [];
  const main = normalizeImagePath(
    pickRowValue(row, ["main_image", "image", "image_path", "mainimage", "thumbnail"]),
  );
  if (main) paths.push(main);

  collectGalleryPathsFromRow(row).forEach((galleryPath) => {
    if (!paths.includes(galleryPath)) paths.push(galleryPath);
  });

  return paths;
};

const walkFilesRecursive = async (dir, baseDir, collected = []) => {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return collected;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFilesRecursive(fullPath, baseDir, collected);
      continue;
    }
    if (!entry.isFile()) continue;

    const relative = path.relative(baseDir, fullPath).split(path.sep).join("/");
    collected.push(relative);
  }

  return collected;
};

export const organizeFilesForCategories = async (categories = []) => {
  await mkdir(IMAGE_UPLOAD_ROOT, { recursive: true });
  const organized = {};

  const walkCategory = async (category) => {
    const folderName = category.category_name;
    const categoryFolder = path.join(IMAGE_UPLOAD_ROOT, folderName);
    if (fs.existsSync(categoryFolder)) {
      const files = await walkFilesRecursive(categoryFolder, IMAGE_UPLOAD_ROOT);
      if (files.length) organized[folderName] = files;
    }

    const children = category.children || category.active_children || [];
    for (const child of children) {
      await walkCategory(child);
    }
  };

  for (const category of categories) {
    await walkCategory(category);
  }

  return organized;
};

export const ensureCategoryFolder = async (folderName) => {
  const destination = path.join(IMAGE_UPLOAD_ROOT, folderName);
  await mkdir(destination, { recursive: true });
  return destination;
};

export const flattenCategoryTree = (tree = [], level = 0, list = []) => {
  for (const category of tree) {
    list.push({
      id: category.id,
      category_name: category.category_name,
      parent_id: category.parent_id,
      level,
      label: `${"— ".repeat(level)}${category.category_name}`,
    });
    const children = category.children || category.active_children || [];
    if (children.length) flattenCategoryTree(children, level + 1, list);
  }
  return list;
};

export const pathExists = async (targetPath) => {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
};
