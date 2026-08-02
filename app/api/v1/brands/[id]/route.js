import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { writeFile } from "fs/promises";
import path from "path";

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   get:
 *     summary: Get a single brand by id
 *     description: Returns the raw brands row (unlike the list endpoints, it is not
 *       passed through formatBrand, so no image_full_url/logo_full_url is added). No
 *       authentication is enforced.
 *     tags: [Brands]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Brand retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 brand: { type: object }
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   put:
 *     summary: Update a brand (multipart or JSON)
 *     description: Supports two content types based on the Content-Type header. When
 *       multipart/form-data, fields are read from the form and an optional `logo` file
 *       is saved to public/uploads/brands (filename stored, e.g. brand_<timestamp>_<name>).
 *       Otherwise the body is parsed as JSON with the same field names. `setTopBrand`
 *       maps to the `top` column and `publish` maps to the `status` column; both
 *       default to 0/1 respectively when not provided. If no new logo is uploaded, the
 *       brand's existing `logo` value is kept (note - this reads from `current.logo`,
 *       a column not present in the brands table, so this effectively stays undefined
 *       unless a new file is uploaded). No authentication is enforced.
 *     tags: [Brands]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brand_name: { type: string }
 *               setTopBrand: { type: string, description: "Maps to top column, defaults to 0" }
 *               publish: { type: string, description: "Maps to status column, defaults to 1" }
 *               order_wise: { type: string }
 *               logo: { type: string, format: binary, description: "Optional new logo file" }
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand_name: { type: string }
 *               setTopBrand: { type: integer, description: "Maps to top column, defaults to 0" }
 *               publish: { type: integer, description: "Maps to status column, defaults to 1" }
 *               order_wise: { type: integer }
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   patch:
 *     summary: Partially update a brand's top/status flags
 *     description: Accepts a JSON body. Only `top` and `status` are accepted, and each
 *       must be exactly the number 0 or 1 (strict === check, so booleans or "0"/"1"
 *       strings are rejected). At least one of the two fields must be provided. No
 *       authentication is enforced.
 *     tags: [Brands]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               top: { type: integer, enum: [0, 1] }
 *               status: { type: integer, enum: [0, 1] }
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       400:
 *         description: Invalid value for top/status, or no valid fields provided
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   delete:
 *     summary: Delete a brand
 *     description: Hard-deletes the brand row. The query does not check
 *       affectedRows, so this responds with success even if the id did not match any
 *       row. No authentication is enforced.
 *     tags: [Brands]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *       500:
 *         description: Server error
 */
// DELETE BRAND
export async function DELETE(req, { params }) {
  try {
    await pool.query("DELETE FROM brands WHERE id = ?", [params.id]);
    return Response.json({ success: true, message: "Brand deleted successfully" });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
