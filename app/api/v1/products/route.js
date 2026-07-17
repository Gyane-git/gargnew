import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

const productSelect = `
  SELECT 
    p.*,
    c.category_name,
    c.parent_id AS category_parent_id,
    c.image AS category_image,
    c.top AS category_top,
    c.status AS category_status,
    b.brand_name,
    b.image AS brand_image,
    b.top AS brand_top,
    b.status AS brand_status
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
`;

// ---- helpers -------------------------------------------------------------
function safeFileName(originalName) {
  const base = path.basename(String(originalName || "file"));
  const ext = path.extname(base).slice(0, 20);
  const stem = base
    .slice(0, base.length - ext.length)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  return `${unique}-${stem || "file"}${ext}`;
}

const ALLOWED_IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_CATALOGUE_EXT = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx"]);

async function saveUpload(file, subdir, allowedExt) {
  const ext = path.extname(file.name || "").toLowerCase();
  if (allowedExt && !allowedExt.has(ext)) {
    throw new Error(`Unsupported file type: ${ext || "unknown"}`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = safeFileName(file.name);
  const uploadDir = path.join(process.cwd(), "public/uploads", subdir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads/${subdir}/${fileName}`;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "" || value === "null") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNumberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toBoolInt(value) {
  return value == 1 || value === "1" || value === true ? 1 : 0;
}

// ---- GET ------------------------------------------------------------------

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 20 });
    const includeInactive = searchParams.get("include_inactive") === "1";
    const where = includeInactive ? "" : "WHERE p.status = 1";

    const [rows] = await pool.query(
      `
      ${productSelect}
      ${where}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset],
    );

    const [[totalRow]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM products p
      ${where}
    `);

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    return NextResponse.json({
      success: true,
      products: enrichedRows.map(formatProduct),
      count: rows.length,
      total: totalRow.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json({ success: false, message: "Failed to fetch products" }, { status: 500 });
  }
}

// ---- POST -------------------------------------------------------------
export async function POST(req) {
  const writtenFiles = [];

  try {
    const formData = await req.formData();

    const product_name = formData.get("product_name") || formData.get("name");
    const product_code = formData.get("product_code");

    const slug = formData.get("slug") || null;
    const product_description = formData.get("product_description") || null;
    const key_specifications = formData.get("key_specifications") || null;
    const packaging = formData.get("packaging") || null;
    const warranty = formData.get("warranty") || null;

    const brand_id = formData.get("brand_id");
    const delivery_target_days = toNullableNumber(formData.get("delivery_target_days"));
    const product_location = formData.get("product_location") || null;

    const has_variations = toBoolInt(formData.get("has_variations"));
    const flash_sale = toBoolInt(formData.get("flash_sale"));
    const weekly_offer = toBoolInt(formData.get("weekly_offer"));
    const special_offer = toBoolInt(formData.get("special_offer"));
    const today_deals = toBoolInt(formData.get("today_deals"));

    const catalogue = formData.get("product_catalogue");
    const galleryImages = formData.getAll("gallery_images").filter((file) => file && typeof file === "object" && file.size > 0);

    const category_id = formData.get("category_id");
    const actual_price = toNumberOrZero(formData.get("actual_price"));
    const sell_price = toNumberOrZero(formData.get("sell_price"));
    const discount = toNumberOrZero(formData.get("discount"));
    const available_quantity = toNumberOrZero(formData.get("available_quantity"));
    const stock_quantity = toNumberOrZero(formData.get("stock_quantity"));
    const status = formData.get("status") ?? 1;
    const image = formData.get("main_image") || formData.get("image");

    // ---- validation ----
    if (!product_name || String(product_name).trim() === "") {
      return NextResponse.json({ success: false, message: "Product name is required" }, { status: 400 });
    }

    if (!product_code || String(product_code).trim() === "") {
      return NextResponse.json({ success: false, message: "Product code is required" }, { status: 400 });
    }

    // Fail fast with a clear message instead of a raw duplicate-key SQL error.
    const [[existing]] = await pool.query("SELECT id FROM products WHERE product_code = ? LIMIT 1", [product_code]);
    if (existing) {
      return NextResponse.json({ success: false, message: `Product code "${product_code}" already exists` }, { status: 409 });
    }

    let variations = [];
    const variationsJson = formData.get("variations");
    if (has_variations === 1 && variationsJson) {
      try {
        variations = JSON.parse(variationsJson);
        if (!Array.isArray(variations)) throw new Error("not an array");
      } catch {
        return NextResponse.json({ success: false, message: "Invalid variations payload" }, { status: 400 });
      }
    }

    // ---- file uploads ----
    let imagePath = "";
    let cataloguePath = "";
    const galleryPaths = [];

    if (catalogue && typeof catalogue === "object" && catalogue.size > 0) {
      cataloguePath = await saveUpload(catalogue, "catalogues", ALLOWED_CATALOGUE_EXT);
      writtenFiles.push(path.join(process.cwd(), "public", cataloguePath));
    }

    if (image && typeof image === "object" && image.size > 0) {
      imagePath = await saveUpload(image, "products", ALLOWED_IMAGE_EXT);
      writtenFiles.push(path.join(process.cwd(), "public", imagePath));
    }

    for (const galleryImage of galleryImages) {
      const galleryPath = await saveUpload(galleryImage, "products", ALLOWED_IMAGE_EXT);
      galleryPaths.push(galleryPath);
      writtenFiles.push(path.join(process.cwd(), "public", galleryPath));
    }

    const variationUploads = []; // { image } per variation, aligned by index
    for (let i = 0; i < variations.length; i++) {
      const varImageFile = formData.get(`variation_image_${i}`);
      let variationImage = "";
      if (varImageFile && typeof varImageFile === "object" && varImageFile.size > 0) {
        variationImage = await saveUpload(varImageFile, "products/variations", ALLOWED_IMAGE_EXT);
        writtenFiles.push(path.join(process.cwd(), "public", variationImage));
      }
      variationUploads.push(variationImage);
    }

    const categoryIdValue = toNullableNumber(category_id);
    const brandIdValue = toNullableNumber(brand_id);

    let finalActualPrice = actual_price;
    let finalSellPrice = sell_price;
    let finalAvailableQty = available_quantity;
    let finalStockQty = stock_quantity;

    if (has_variations === 1 && variations.length > 0) {
      const actualPrices = variations.map((v) => toNumberOrZero(v.actual_price)).filter((n) => n > 0);
      const sellPrices = variations.map((v) => toNumberOrZero(v.sell_price)).filter((n) => n > 0);

      finalActualPrice = actualPrices.length ? Math.max(...actualPrices) : actual_price;
      finalSellPrice = sellPrices.length ? Math.min(...sellPrices) : sell_price;
      finalAvailableQty = variations.reduce((sum, v) => sum + toNumberOrZero(v.available_qty), 0);
      finalStockQty = variations.reduce((sum, v) => sum + toNumberOrZero(v.stock_qty), 0);
    }

    // ---- DB writes: product + variations happen atomically ----
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO products (product_code, product_name, slug, product_description, key_specifications, packaging, warranty, category_id, brand_id, delivery_target_days, discount, actual_price, sell_price, available_quantity, stock_quantity, product_location, has_variations, flash_sale, weekly_offer, special_offer, today_deals, main_image, product_catalogue, status, created_at, updated_at) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [product_code, product_name, slug, product_description, key_specifications, packaging, warranty, categoryIdValue, brandIdValue, delivery_target_days, discount, finalActualPrice, finalSellPrice, finalAvailableQty, finalStockQty, product_location, has_variations, flash_sale, weekly_offer, special_offer, today_deals, imagePath, cataloguePath, status],
      );

      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        const variationImage = variationUploads[i];

        await conn.query(
          `
      INSERT INTO product_variations (product_code, attributes, price, stock, sku, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?,NOW(),NOW())`,
          [
            product_code,
            JSON.stringify({
              name: variation.name,
              image: variationImage,
              sell_price: toNumberOrZero(variation.sell_price),
              available_qty: toNumberOrZero(variation.available_qty),
            }),
            toNumberOrZero(variation.actual_price),
            toNumberOrZero(variation.stock_qty),
            `${product_code}-${i + 1}`,
          ],
        );
      }

      for (const galleryPath of galleryPaths) {
        await conn.query(
          `INSERT INTO product_images (product_code, image_path, created_at, updated_at)
           VALUES (?, ?, NOW(), NOW())`,
          [product_code, galleryPath],
        );
      }

      await conn.commit();
    } catch (dbError) {
      await conn.rollback();
      throw dbError;
    } finally {
      conn.release();
    }

    const imageMap = await fetchProductImagesMap([product_code]);
    const [insertedRows] = await pool.query("SELECT * FROM products WHERE product_code = ? LIMIT 1", [product_code]);
    const insertedProduct = insertedRows[0] ? enrichProductsWithImages(insertedRows, imageMap)[0] : null;

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product: insertedProduct ? formatProduct(insertedProduct) : null,
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, message: "Product code already exists" }, { status: 409 });
    }

    return NextResponse.json({ success: false, message: error.message || "Failed to create product" }, { status: 500 });
  }
}
