import pool from "@/utils/db";
import { formatBanner } from "@/utils/apiFormatters";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET ALL BANNERS
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

    return Response.json({
      success: true,
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
