import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { writeFile } from "fs/promises";
import path from "path";

// GET SINGLE BRAND
export async function GET(req, { params }) {
  try {
    const [rows] = await pool.query("SELECT * FROM brands WHERE id = ?", [params.id]);

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true, brand: rows[0] });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// UPDATE BRAND
export async function PUT(req, { params }) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let brand_name, setTopBrand, publish, order_wise;
    let newLogoPath = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      brand_name = formData.get("brand_name");
      setTopBrand = formData.get("setTopBrand");
      publish = formData.get("publish");
      order_wise = formData.get("order_wise");

      const logoFile = formData.get("logo");

      if (logoFile && logoFile.size > 0) {
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `brand_${Date.now()}_${logoFile.name}`;
        const filePath = path.join(process.cwd(), "public/uploads/brands", filename);

        await writeFile(filePath, buffer);
        newLogoPath = filename;
      }
    } else {
      const body = await req.json();

      brand_name = body.brand_name;
      setTopBrand = body.setTopBrand;
      publish = body.publish;
      order_wise = body.order_wise;
    }

    const [rows] = await pool.query("SELECT * FROM brands WHERE id = ?", [params.id]);

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    const current = rows[0];

    const finalLogo = newLogoPath ?? current.logo;

    await pool.query(
      `UPDATE brands 
       SET brand_name = ?, 
           image = ?, 
           top = ?, 
           status = ?, 
           order_wise = ?
       WHERE id = ?`,
      [brand_name, finalLogo, setTopBrand ?? 0, publish ?? 1, order_wise ?? null, params.id],
    );

    return Response.json({
      success: true,
      message: "Brand updated successfully",
    });
  } catch (err) {
    console.error("PUT brand error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
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

    values.push(id); // for WHERE id = ?

    const sql = `UPDATE brands SET ${updates.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Brand updated successfully",
    });
  } catch (error) {
    console.error("PATCH /api/v1/brands/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE BRAND
export async function DELETE(req, { params }) {
  try {
    await pool.query("DELETE FROM brands WHERE id = ?", [params.id]);
    return Response.json({ success: true, message: "Brand deleted successfully" });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
