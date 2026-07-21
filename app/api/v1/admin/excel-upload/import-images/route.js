import pool from "@/utils/db";
import {
  parseExcelBuffer,
  normalizeImagePath,
  collectGalleryPathsFromRow,
  pickRowValue,
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

    let updated = 0;
    let imagesLinked = 0;
    const errors = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2;

      try {
        const product_code = String(pickRowValue(row, ["product_code", "productcode", "code"]) || "").trim();
        if (!product_code) {
          errors.push(`Row ${rowNumber}: product_code is required.`);
          continue;
        }

        const [productRows] = await connection.query(
          "SELECT id, product_code FROM products WHERE product_code = ? LIMIT 1",
          [product_code],
        );

        if (!productRows.length) {
          errors.push(`Row ${rowNumber}: product "${product_code}" not found.`);
          continue;
        }

        const mainImage = normalizeImagePath(
          pickRowValue(row, ["main_image", "image", "image_path", "mainimage", "thumbnail"]),
        );
        const galleryImages = collectGalleryPathsFromRow(row);

        if (!mainImage && !galleryImages.length) {
          errors.push(
            `Row ${rowNumber}: no image paths found. Fill main_image or image_1/image_2/gallery_1 columns.`,
          );
          continue;
        }

        if (mainImage) {
          await connection.query("UPDATE products SET main_image = ?, updated_at = NOW() WHERE product_code = ?", [
            mainImage,
            product_code,
          ]);
        }

        for (const imagePath of galleryImages) {
          if (mainImage && imagePath === mainImage) continue;

          const [existing] = await connection.query(
            "SELECT id FROM product_images WHERE product_code = ? AND image_path = ? LIMIT 1",
            [product_code, imagePath],
          );

          if (existing.length) continue;

          await connection.query(
            `INSERT INTO product_images (product_code, image_path, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())`,
            [product_code, imagePath],
          );
          imagesLinked += 1;
        }

        updated += 1;
      } catch (rowError) {
        errors.push(`Row ${rowNumber}: ${rowError.message || "Failed to import images."}`);
      }
    }

    await connection.commit();

    return Response.json({
      success: true,
      message: `Import successful! Products updated: ${updated}, Gallery images linked: ${imagesLinked}.`,
      updated,
      imagesLinked,
      errors,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }
    console.error("IMPORT IMAGES ERROR:", error);
    return Response.json(
      { success: false, message: error.message || "Failed to import images." },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
