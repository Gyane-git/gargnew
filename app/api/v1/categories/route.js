import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM categories");

    return NextResponse.json({
      success: true,
      categories: rows,
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
