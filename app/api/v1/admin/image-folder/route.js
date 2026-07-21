import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { buildCategoryTree } from "@/utils/apiFormatters";
import { ensureCategoryFolder, organizeFilesForCategories } from "@/utils/excelUpload";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    const categories = buildCategoryTree(rows, { onlyActive: false });
    const organizedFiles = await organizeFilesForCategories(categories);

    return NextResponse.json({
      success: true,
      categories,
      organizedFiles,
      basePath: "/images/uploads",
    });
  } catch (error) {
    console.error("IMAGE FOLDER LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load image folders." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const zipFile = formData.get("zip_file");
    const folderName = String(formData.get("folder_name") || "").trim();

    if (!folderName) {
      return NextResponse.json({ success: false, message: "folder_name is required." }, { status: 400 });
    }

    if (!zipFile || typeof zipFile !== "object" || !zipFile.size) {
      return NextResponse.json({ success: false, message: "ZIP file is required." }, { status: 400 });
    }

    const fileName = String(zipFile.name || "").toLowerCase();
    if (!fileName.endsWith(".zip")) {
      return NextResponse.json({ success: false, message: "Only .zip files are allowed." }, { status: 400 });
    }

    let AdmZip;
    try {
      AdmZip = (await import("adm-zip")).default;
    } catch {
      return NextResponse.json(
        { success: false, message: "adm-zip package is missing. Run: npm install adm-zip" },
        { status: 500 },
      );
    }

    const destinationPath = await ensureCategoryFolder(folderName);
    const buffer = Buffer.from(await zipFile.arrayBuffer());
    const zip = new AdmZip(buffer);
    zip.extractAllTo(destinationPath, true);

    return NextResponse.json({
      success: true,
      message: "Files uploaded and extracted successfully!",
      folder: folderName,
      path: `/images/uploads/${folderName}`,
    });
  } catch (error) {
    console.error("IMAGE FOLDER UPLOAD ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to extract the ZIP file." },
      { status: 500 },
    );
  }
}
