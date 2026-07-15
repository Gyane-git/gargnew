import pool from "@/utils/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { formatCategoryRows } from "@/utils/apiFormatters";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      category: formatCategoryRows(rows)[0],
    });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const formData = await req.formData();

    const category_name = formData.get("category_name");
    const parent_id = formData.get("parent_id") === "" || formData.get("parent_id") === "null" ? null : formData.get("parent_id");
    const top = formData.get("top");
    const status = formData.get("status");
    const image = formData.get("image");
    const existing_image = formData.get("existing_image");
    const remove_image = formData.get("remove_image");

    let imagePath = existing_image || "";

    // If new image uploaded
    if (image && typeof image === "object" && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${image.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      const filePath = path.join(uploadDir, fileName);

      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, buffer);

      imagePath = `/uploads/${fileName}`;
    }

    // If user removed image
    if (remove_image === "1") {
      imagePath = "";
    }

    const [result] = await pool.query("UPDATE categories SET category_name = ?, parent_id = ?, image = ?, top = ?, status = ? WHERE id = ?", [category_name, parent_id, imagePath, top, status, id]);

    if (result.affectedRows === 0) {
      return Response.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("PUT ERROR:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Only these two fields are allowed to be updated via PATCH
    const allowedFields = ["top", "status"];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const val = body[field];

        // Must be exactly 0 or 1
        if (val !== 0 && val !== 1) {
          return NextResponse.json({ success: false, message: `Invalid value for "${field}". Must be 0 or 1.` }, { status: 400 });
        }

        updates.push(`${field} = ?`);
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: "No valid fields provided. Send top or status." }, { status: 400 });
    }

    values.push(id);

    const sql = `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("PATCH /api/v1/categories/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json({ success: false, message: "ID required" }, { status: 400 });
    }

    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return Response.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
