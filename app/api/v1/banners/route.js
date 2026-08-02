import pool from "@/utils/db";
import { formatBanner } from "@/utils/apiFormatters";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET ALL BANNERS
/**
 * @swagger
 * /api/v1/banners:
 *   get:
 *     summary: List carousel banners
 *     description: Returns rows from carousel_images, defaulting to only active (status = 1)
 *       banners unless include_inactive=1 is passed. Optionally filter by exact is_offer value.
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: include_inactive
 *         schema: { type: string, enum: ["0", "1"] }
 *         description: Pass "1" to include inactive (status != 1) banners as well.
 *       - in: query
 *         name: is_offer
 *         schema: { type: string }
 *         description: Filter banners by exact is_offer column value (e.g. "0" or "1").
 *     responses:
 *       200:
 *         description: Banners fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Banners fetched successfully. }
 *                 banners:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       product_code: { type: string }
 *                       file_path: { type: string, nullable: true }
 *                       mobile_file_path: { type: string, nullable: true }
 *                       is_offer: { type: integer }
 *                       status: { type: integer }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *                       image_full_url: { type: string, nullable: true }
 *                       mobile_image_full_url: { type: string, nullable: true }
 *                       image_url: { type: string, nullable: true }
 *                       file_path_full_url: { type: string, nullable: true }
 *                       mobile_file_path_full_url: { type: string, nullable: true }
 *       500:
 *         description: Server error.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("include_inactive") === "1";
    const onlyOffer = searchParams.get("is_offer");

    const conditions = [];
    const params = [];

    if (!includeInactive) {
      conditions.push("status = 1");
    }

    if (onlyOffer !== null) {
      conditions.push("is_offer = ?");
      params.push(onlyOffer);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT * FROM carousel_images ${where} ORDER BY id DESC`,
      params,
    );

    // `message` added for Laravel parity (BannerController::get_banners) - additive only,
    // app/dashboard/GargDental.js and admin banners pages read success/banners[] fields.
    return Response.json({
      success: true,
      message: "Banners fetched successfully.",
      banners: rows.map(formatBanner),
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// ADD BANNER
/**
 * @swagger
 * /api/v1/banners:
 *   post:
 *     summary: Create a new carousel banner
 *     description: Reads a multipart/form-data payload, optionally saves desktop/mobile images
 *       to public/uploads/carousel, and inserts a row into carousel_images.
 *     tags: [Banners]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product_code: { type: string, description: Required product code to associate with the banner. }
 *               is_offer: { type: string, description: "Defaults to 0 if omitted." }
 *               status: { type: string, description: "Defaults to 1 if omitted." }
 *               file: { type: string, format: binary, description: Desktop banner image. }
 *               mobile_file: { type: string, format: binary, description: Mobile banner image. }
 *             required: [product_code]
 *     responses:
 *       200:
 *         description: Banner added successfully.
 *       400:
 *         description: Missing required product_code.
 *       500:
 *         description: Server error.
 */
export async function POST(req) {
  try {
    const formData = await req.formData();

    const product_code = String(formData.get("product_code") || "").trim();
    const is_offer = formData.get("is_offer") || 0;
    const status = formData.get("status") || 1;

    const file = formData.get("file");
    const mobileFile = formData.get("mobile_file");

    if (!product_code) {
      return Response.json(
        { success: false, message: "Product is required" },
        { status: 400 },
      );
    }

    let file_path = null;
    let mobile_file_path = null;

    // SAVE DESKTOP IMAGE
    if (file && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = Date.now() + "_" + file.name;
      const uploadDir = path.join(process.cwd(), "public/uploads/carousel");
      const filepath = path.join(uploadDir, filename);

      await mkdir(uploadDir, { recursive: true });
      await writeFile(filepath, buffer);
      file_path = filename;
    }

    // SAVE MOBILE IMAGE
    if (mobileFile && mobileFile.name) {
      const bytes = await mobileFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = Date.now() + "_" + mobileFile.name;
      const uploadDir = path.join(process.cwd(), "public/uploads/carousel");
      const filepath = path.join(uploadDir, filename);

      await mkdir(uploadDir, { recursive: true });
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

    return Response.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
