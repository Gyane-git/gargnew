import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import pool from "@/utils/db";
import { buildCategoryTree, formatCategoryRows, shouldReturnFlatCategories } from "@/utils/apiFormatters";

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: List categories
 *     description: Returns either a flat list of all categories or a nested tree of
 *       active categories. The flat form is returned when the `flat=1` query param is
 *       present, or automatically when the request's `Referer` header contains `/admin`
 *       (see shouldReturnFlatCategories); otherwise an active-only tree (parent/children,
 *       via buildCategoryTree) is returned. No authentication is enforced.
 *     tags: [Categories]
 *     parameters:
 *       - name: flat
 *         in: query
 *         required: false
 *         schema: { type: string, enum: ["1"] }
 *         description: Pass flat=1 to force a flat array instead of the nested tree.
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 categories:
 *                   type: array
 *                   description: Flat array of categories (flat mode) or nested tree
 *                     with `children`/`active_children` (tree mode). Each item includes
 *                     image_full_url/image_url derived from the stored image path.
 *                   items: { type: object }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string }
 */
// export async function GET(req) {
//   try {
//     const [rows] = await pool.query("SELECT * FROM categories ORDER BY id ASC");
//     const categories = shouldReturnFlatCategories(req)
//       ? formatCategoryRows(rows)
//       : buildCategoryTree(rows, { onlyActive: true });

//     return NextResponse.json({
//       success: true,
//       categories,
//     });
//   } catch (error) {
//     console.error("GET CATEGORIES ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: error.message,
//       },
//       { status: 500 },
//     );
//   }
// }

export async function GET(req) {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.*,
        s.id AS storage_id,
        s.data_type,
        s.data_id,
        s.key,
        s.value,
        s.created_at AS storage_created_at,
        s.updated_at AS storage_updated_at
      FROM categories c
      LEFT JOIN storages s
        ON s.data_id = c.id
       
      ORDER BY 
        CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END ASC,
        c.parent_id ASC,
        c.id ASC
    `);

    const formattedCategories = formatCategoryRows(rows);

    const formattedMap = new Map(formattedCategories.map((category) => [category.id, category]));

    const categoryMap = new Map();

    for (const row of rows) {
      if (!categoryMap.has(row.id)) {
        categoryMap.set(row.id, {
          ...formattedMap.get(row.id),
          storage: [],
        });
      }

      if (row.storage_id) {
        categoryMap.get(row.id).storage.push({
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

    const categoryRows = [...categoryMap.values()];

    const categories = shouldReturnFlatCategories(req) ? categoryRows : buildCategoryTree(categoryRows, { onlyActive: true });

    return NextResponse.json({
      success: true,
      message: "Categories fetched successfully.",
      categories,
    });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a category
 *     description: Accepts multipart/form-data. Reads `name` (falls back to
 *       `category_name`) and `parentCategory` (falls back to `parent_id`); an empty
 *       string or the literal "null" for parent is stored as NULL. An optional `image`
 *       file is saved to public/uploads. New categories are always created with
 *       status=1 and top=0. No authentication is enforced.
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: "Category name (or use category_name)" }
 *               category_name: { type: string, description: "Alias for name" }
 *               parentCategory: { type: string, description: "Parent category id (or use parent_id); empty/\"null\" means no parent" }
 *               parent_id: { type: string, description: "Alias for parentCategory" }
 *               image: { type: string, format: binary, description: "Optional category image" }
 *             required: [name]
 *     responses:
 *       200:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Category created successfully" }
 *       400:
 *         description: Category name is required
 *       500:
 *         description: Server error
 */
export async function POST(req) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") || formData.get("category_name");

    const parent_id = formData.get("parentCategory") || formData.get("parent_id");

    const image = formData.get("image");

    if (!name) {
      return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    let imagePath = "";

    // IMAGE HANDLING
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

    const parentIdValue = parent_id === "" || parent_id === "null" ? null : Number(parent_id);

    await pool.query(
      `INSERT INTO categories
      (category_name, parent_id, image, status, top)
      VALUES (?, ?, ?, ?, ?)`,
      [name, parentIdValue, imagePath, 1, 0],
    );

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("ADD CATEGORY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
