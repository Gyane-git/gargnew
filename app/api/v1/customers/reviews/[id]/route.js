import { NextResponse } from "next/server";
import pool from "@/utils/db";

/**
 * @swagger
 * /api/v1/customers/reviews/{id}:
 *   delete:
 *     summary: Delete a product review by ID
 *     description: No API-layer authentication is enforced on this route.
 *     tags: [Admin - Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400: { description: Invalid ID }
 *       404: { description: Review not found }
 *       500: { description: Failed to delete review }
 */
// DELETE /api/v1/customers/reviews/[id]
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    const [[row]] = await pool.query("SELECT id FROM product_reviews WHERE id = ?", [id]);
    if (!row) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM product_reviews WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("[DELETE /api/v1/customers/reviews/[id]]", error);
    return NextResponse.json({ success: false, message: "Failed to delete review" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/customers/reviews/{id}:
 *   get:
 *     summary: Get a product review by ID
 *     description: No API-layer authentication is enforced on this route. Returns the full
 *       row (SELECT *) from product_reviews.
 *     tags: [Admin - Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 review: { type: object }
 *       400: { description: Invalid ID }
 *       404: { description: Review not found }
 *       500: { description: Failed to fetch review }
 */
// GET /api/v1/customers/reviews/[id]
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    const [[review]] = await pool.query("SELECT * FROM product_reviews WHERE id = ?", [id]);
    if (!review) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[GET /api/v1/customers/reviews/[id]]", error);
    return NextResponse.json({ success: false, message: "Failed to fetch review" }, { status: 500 });
  }
}
