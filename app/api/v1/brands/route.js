import pool from "@/utils/db";
import { formatBrand } from "@/utils/apiFormatters";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET ALL BRANDS
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("include_inactive") === "1";
    const conditions = includeInactive ? [] : ["status = 1"];
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(`SELECT * FROM brands ${where} ORDER BY COALESCE(order_wise, 999999), id DESC`);

    return Response.json({
      success: true,
      brands: rows.map(formatBrand),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ADD BRAND
export async function POST(req) {
  try {
    const formData = await req.formData();

    const brand_name = formData.get("brand_name");
    const top = formData.get("top") || 0;
    const status = formData.get("status") || 1;
    const order_wise = formData.get("order_wise") || null;
    const file = formData.get("image");

    if (!brand_name) {
      return Response.json({ success: false, message: "Brand name is required" }, { status: 400 });
    }

    let image_path = "";

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/brands");
      const filepath = path.join(uploadDir, filename);

      await mkdir(uploadDir, { recursive: true });
      await writeFile(filepath, buffer);

      image_path = filename;
    }

    await pool.query(
      `INSERT INTO brands
      (brand_name, top, status, order_wise, image)
      VALUES (?, ?, ?, ?, ?)`,
      [brand_name, top, status, order_wise, image_path],
    );

    return Response.json({
      success: true,
      message: "Brand added successfully",
    });
  } catch (error) {
    console.error("POST ERROR:", error);

    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// UPDATE BRAND
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, brand_name, image, top, status, order_wise } = body;

    if (!id) {
      return Response.json({ success: false, message: "Brand ID is required" }, { status: 400 });
    }

    const [result] = await pool.query(
      `UPDATE brands 
       SET brand_name=?, image=?, top=?, status=?, order_wise=?, updated_at=NOW()
       WHERE id=?`,
      [brand_name, image, top, status, order_wise, id],
    );

    if (result.affectedRows === 0) {
      return Response.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Brand updated successfully",
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);

    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE BRAND
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ success: false, message: "Brand ID is required" }, { status: 400 });
    }

    const [result] = await pool.query("DELETE FROM brands WHERE id=?", [id]);

    if (result.affectedRows === 0) {
      return Response.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
