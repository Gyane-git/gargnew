import pool from "@/utils/db";
import { buildCategoryTree } from "@/utils/apiFormatters";
import {
  PRODUCT_TEMPLATE_HEADERS,
  IMAGE_TEMPLATE_HEADERS,
  buildWorkbookBuffer,
  excelDownloadResponse,
  flattenCategoryTree,
} from "@/utils/excelUpload";

export async function GET(request, context) {
  try {
    const { type } = await context.params;
    const { searchParams } = new URL(request.url);

    if (type === "categories") {
      const [rows] = await pool.query(
        "SELECT id, category_name, parent_id, status FROM categories ORDER BY id ASC",
      );
      const buffer = buildWorkbookBuffer(
        "Categories",
        ["id", "category_name", "parent_id", "status"],
        rows.map((row) => [row.id, row.category_name, row.parent_id ?? "", row.status ?? 1]),
      );
      return excelDownloadResponse(buffer, "categories.xlsx");
    }

    if (type === "brands") {
      const [rows] = await pool.query("SELECT id, brand_name, status FROM brands ORDER BY id ASC");
      const buffer = buildWorkbookBuffer(
        "Brands",
        ["id", "brand_name", "status"],
        rows.map((row) => [row.id, row.brand_name, row.status ?? 1]),
      );
      return excelDownloadResponse(buffer, "brands.xlsx");
    }

    if (type === "products") {
      const buffer = buildWorkbookBuffer("Products", PRODUCT_TEMPLATE_HEADERS, [
        ["Sample Product", 1, 3, 1, 500, 450, 100, 100],
      ]);
      return excelDownloadResponse(buffer, "product_template.xlsx");
    }

    if (type === "images") {
      const categoryId = Number(searchParams.get("category_id") || 0);
      if (!categoryId) {
        return Response.json({ success: false, message: "category_id is required." }, { status: 400 });
      }

      const [products] = await pool.query(
        `SELECT product_code, product_name, main_image
         FROM products
         WHERE category_id = ?
         ORDER BY id ASC`,
        [categoryId],
      );

      const rows = products.map((product) => [
        product.product_code,
        product.product_name,
        product.main_image || "",
        "/images/uploads/your-folder/gallery-1.jpg",
        "/images/uploads/your-folder/gallery-2.jpg",
        "",
        "",
        "",
      ]);

      const buffer = buildWorkbookBuffer("Images", IMAGE_TEMPLATE_HEADERS, rows);
      return excelDownloadResponse(buffer, "image_template.xlsx");
    }

    if (type === "category-list") {
      const [rows] = await pool.query("SELECT * FROM categories ORDER BY id ASC");
      const tree = buildCategoryTree(rows, { onlyActive: false });
      return Response.json({
        success: true,
        categories: tree,
        flat: flattenCategoryTree(tree),
      });
    }

    return Response.json({ success: false, message: "Unknown template type." }, { status: 404 });
  } catch (error) {
    console.error("EXCEL TEMPLATE ERROR:", error);
    return Response.json({ success: false, message: error.message || "Failed to generate template." }, { status: 500 });
  }
}
