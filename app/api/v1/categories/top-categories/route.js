import pool from "@/utils/db";
import { buildCategoryTree } from "@/utils/apiFormatters";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM categories WHERE status = 1 ORDER BY id ASC");
    const categories = buildCategoryTree(rows, { onlyActive: true }).filter((category) => Number(category.top) === 1);

    return Response.json({
      success: true,
      categories,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
