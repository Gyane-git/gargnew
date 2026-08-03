import pool from "@/utils/db";
import { formatBrand } from "@/utils/apiFormatters";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * @swagger
 * /api/v1/brands:
 *   get:
 *     summary: List brands
 *     description: Returns active brands (status=1) ordered by order_wise then id
 *       descending, unless `include_inactive=1` is passed, in which case all brands
 *       are returned. No authentication is enforced.
 *     tags: [Brands]
 *     parameters:
 *       - name: include_inactive
 *         in: query
 *         required: false
 *         schema: { type: string, enum: ["1"] }
 *         description: Pass include_inactive=1 to include inactive (status=0) brands.
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 brands:
 *                   type: array
 *                   description: Brand rows with image_full_url/image_url/logo_full_url
 *                     derived from the stored image path.
 *                   items: { type: object }
 *       500:
 *         description: Server error
 */
// GET ALL BRANDS
// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const includeInactive = searchParams.get("include_inactive") === "1";
//     const conditions = includeInactive ? [] : ["status = 1"];
//     const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
//     const [rows] = await pool.query(`SELECT * FROM brands ${where} ORDER BY COALESCE(order_wise, 999999), id DESC`);

//     return Response.json({
//       success: true,
//       brands: rows.map(formatBrand),
//     });
//   } catch (error) {
//     return Response.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const includeInactive = searchParams.get("include_inactive") === "1";
    const conditions = includeInactive ? [] : ["b.status = 1"];
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(`
      SELECT
        b.*,
        s.id AS storage_id,
        s.data_type,
        s.data_id,
        s.key,
        s.value,
        s.created_at AS storage_created_at,
        s.updated_at AS storage_updated_at
      FROM brands b
      LEFT JOIN storages s
        ON s.data_id = b.id
      ${where}
      ORDER BY COALESCE(b.order_wise, 999999), b.id DESC
    `);

    const brandsMap = new Map();

    for (const row of rows) {
      if (!brandsMap.has(row.id)) {
        brandsMap.set(row.id, {
          ...formatBrand(row),
          storage: [],
        });
      }

      if (row.storage_id) {
        brandsMap.get(row.id).storage.push({
          id: row.storage_id,
          data_type: row.data_type,
          data_id: row.data_id,
          key: row.key,
          value: row.value,
          created_at: row.storage_created_at,
          updated_at: row.storage_updated_at,
        });
      }
    }

    return Response.json({
      success: true,
      message: "Brands fetched successfully.",
      brands: [...brandsMap.values()],
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/brands:
 *   post:
 *     summary: Create a brand
 *     description: Accepts multipart/form-data. `brand_name` is required; `top` and
 *       `status` default to 0 and 1 respectively when omitted; `order_wise` defaults
 *       to NULL. An optional `image` file is saved to public/uploads/brands and only
 *       the filename (not the full path) is stored. No authentication is enforced.
 *     tags: [Brands]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brand_name: { type: string }
 *               top: { type: string, description: "0 or 1, defaults to 0" }
 *               status: { type: string, description: "0 or 1, defaults to 1" }
 *               order_wise: { type: string, description: "Sort order, defaults to null" }
 *               image: { type: string, format: binary, description: "Optional brand logo/image" }
 *             required: [brand_name]
 *     responses:
 *       200:
 *         description: Brand added successfully
 *       400:
 *         description: Brand name is required
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/v1/brands:
 *   put:
 *     summary: Update a brand
 *     description: Accepts a JSON body. `id` is required; the remaining fields are
 *       written as-is with no validation (e.g. `image` is stored verbatim as passed,
 *       it is not a file upload). No authentication is enforced.
 *     tags: [Brands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: integer }
 *               brand_name: { type: string }
 *               image: { type: string, description: "Stored image path/filename as-is" }
 *               top: { type: integer }
 *               status: { type: integer }
 *               order_wise: { type: integer }
 *             required: [id]
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       400:
 *         description: Brand ID is required
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/v1/brands:
 *   delete:
 *     summary: Delete a brand
 *     description: Brand id is passed as a query parameter (not a path segment). Hard
 *       deletes the brand row. No authentication is enforced.
 *     tags: [Brands]
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *       400:
 *         description: Brand ID is required
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
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
