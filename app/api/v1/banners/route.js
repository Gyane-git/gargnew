import pool from "@/utils/db";
import { writeFile } from "fs/promises";
import path from "path";

// GET ALL BANNERS
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM carousel_images ORDER BY id DESC");

    return Response.json({
      success: true,
      banners: rows.map(row => ({
        ...row,
        image_full_url: row.file_path ? `/uploads/carousel/${row.file_path}` : null,
      })),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ADD BANNER
export async function POST(req) {
  try {
    const formData = await req.formData();

    const product_code = formData.get("product_code");
    const is_offer = formData.get("is_offer") || 0;
    const status = formData.get("status") || 1;

    const file = formData.get("file");
    const mobileFile = formData.get("mobile_file");

    let file_path = null;
    let mobile_file_path = null;

    // SAVE DESKTOP IMAGE
    if (file && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = Date.now() + "_" + file.name;
      const filepath = path.join(process.cwd(), "public/uploads/carousel", filename);

      await writeFile(filepath, buffer);
      file_path = filename;
    }

    // SAVE MOBILE IMAGE
    if (mobileFile && mobileFile.name) {
      const bytes = await mobileFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = Date.now() + "_" + mobileFile.name;
      const filepath = path.join(process.cwd(), "public/uploads/carousel", filename);

      await writeFile(filepath, buffer);
      mobile_file_path = filename;
    }

    await pool.query(
      `INSERT INTO carousel_images 
      (product_code, file_path, mobile_file_path, is_offer, status) 
      VALUES (?, ?, ?, ?, ?)`,
      [product_code, file_path, mobile_file_path, is_offer, status],
    );

    return Response.json({
      success: true,
      message: "Banner added successfully",
    });
  } catch (error) {
    console.error("POST ERROR:", error);

    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
