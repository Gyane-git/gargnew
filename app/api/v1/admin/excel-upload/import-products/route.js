import pool from "@/utils/db";
import {
  parseExcelBuffer,
  slugify,
  toNumberOrZero,
  generateProductCode,
  pickRowValue,
  resolveCategoryId,
  resolveBrandId,
} from "@/utils/excelUpload";

export async function POST(request) {
  let connection = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file !== "object" || !file.size) {
      return Response.json({ success: false, message: "Excel file is required." }, { status: 400 });
    }

    const name = String(file.name || "").toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      return Response.json({ success: false, message: "Only .xlsx, .xls or .csv files are allowed." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseExcelBuffer(buffer);

    if (!rows.length) {
      return Response.json({ success: false, message: "Excel file is empty." }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    let created = 0;
    let updated = 0;
    const errors = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;

      try {
        const product_name = String(pickRowValue(row, ["product_name", "name", "product", "product_title"]) || "").trim();

        if (!product_name) {
          errors.push(`Row ${rowNumber}: product_name is required.`);
          continue;
        }

        const category_id = await resolveCategoryId(connection, row);
        const brand_id = await resolveBrandId(connection, row);

        if (!category_id) {
          const categoryValue = pickRowValue(row, ["category_id", "category_name", "category"]);
          errors.push(
            `Row ${rowNumber}: category_id is required. Use category number from Categories List, or category_name column. Found: "${categoryValue || "empty"}".`,
          );
          continue;
        }

        if (!brand_id) {
          const brandValue = pickRowValue(row, ["brand_id", "brand_name", "brand"]);
          errors.push(
            `Row ${rowNumber}: brand_id is required. Use brand number from Brands List, or brand_name column. Found: "${brandValue || "empty"}".`,
          );
          continue;
        }

        const actual_price = toNumberOrZero(pickRowValue(row, ["actual_price", "actualprice", "price", "mrp"]));
        const sell_price = toNumberOrZero(pickRowValue(row, ["sell_price", "sellprice", "sale_price", "selling_price"]));
        const available_quantity = toNumberOrZero(
          pickRowValue(row, ["available_quantity", "available_qty", "availableqty", "qty", "quantity"]),
        );
        const stock_quantity = toNumberOrZero(
          pickRowValue(row, ["stock_quantity", "stock_qty", "stockqty", "stock"]),
        );
        const discount = Math.max(actual_price - sell_price, 0);

        const deliveryRaw = pickRowValue(row, ["delivery_target_days", "delivery_days", "delivery"]);
        const delivery_target_days = deliveryRaw === "" ? null : toNumberOrZero(deliveryRaw);

        const [existingRows] = await connection.query(
          "SELECT id, product_code FROM products WHERE product_name = ? LIMIT 1",
          [product_name],
        );

        if (existingRows.length) {
          const product_code = existingRows[0].product_code;
          const slug = slugify(`${product_name}-${product_code}`) || product_code.toLowerCase();

          await connection.query(
            `UPDATE products SET
              slug = ?,
              category_id = ?,
              brand_id = ?,
              delivery_target_days = ?,
              discount = ?,
              actual_price = ?,
              sell_price = ?,
              available_quantity = ?,
              stock_quantity = ?,
              updated_at = NOW()
             WHERE product_code = ?`,
            [
              slug,
              category_id,
              brand_id,
              delivery_target_days,
              discount,
              actual_price,
              sell_price,
              available_quantity,
              stock_quantity,
              product_code,
            ],
          );
          updated += 1;
        } else {
          const product_code = await generateProductCode(connection);
          const slug = slugify(`${product_name}-${product_code}`) || product_code.toLowerCase();

          await connection.query(
            `INSERT INTO products (
              product_code, product_name, slug, category_id, brand_id, delivery_target_days,
              discount, actual_price, sell_price, available_quantity, stock_quantity,
              has_variations, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, NOW(), NOW())`,
            [
              product_code,
              product_name,
              slug,
              category_id,
              brand_id,
              delivery_target_days,
              discount,
              actual_price,
              sell_price,
              available_quantity,
              stock_quantity,
            ],
          );
          created += 1;
        }
      } catch (rowError) {
        errors.push(`Row ${rowNumber}: ${rowError.message || "Failed to import."}`);
      }
    }

    await connection.commit();

    return Response.json({
      success: true,
      message: `Products upload successful! Created: ${created}, Updated: ${updated}.`,
      created,
      updated,
      errors,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }
    console.error("IMPORT PRODUCTS ERROR:", error);
    return Response.json(
      { success: false, message: error.message || "Failed to import products." },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
