import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import pool from "@/utils/db";
import { buildCategoryTree } from "@/utils/apiFormatters";
import { ensureCategoryFolder, organizeFilesForCategories } from "@/utils/excelUpload";
import { requireAdminAuth } from "@/utils/adminAuth";

export async function GET(request) {
  try {
    const adminAuth = await requireAdminAuth(request, pool);
    if (adminAuth.error) return adminAuth.error;

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
    const adminAuth = await requireAdminAuth(request, pool);
    if (adminAuth.error) return adminAuth.error;

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
    const storedFolderName = path.basename(destinationPath);
    const buffer = Buffer.from(await zipFile.arrayBuffer());
    const zip = new AdmZip(buffer);
    for (const entry of zip.getEntries()) {
      const entryName = String(entry.entryName || "").replace(/\\/g, "/");
      if (!entryName || entryName.includes("..")) continue;
      if (entry.isDirectory) continue;

      const resolvedPath = path.resolve(destinationPath, entryName);
      const rootPath = path.resolve(destinationPath);
      if (resolvedPath !== rootPath && !resolvedPath.startsWith(`${rootPath}${path.sep}`)) continue;

      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      await fs.writeFile(resolvedPath, entry.getData());
    }

    return NextResponse.json({
      success: true,
      message: "Files uploaded and extracted successfully!",
      folder: storedFolderName,
      path: `/images/uploads/${storedFolderName}`,
    });
  } catch (error) {
    console.error("IMAGE FOLDER UPLOAD ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to extract the ZIP file." },
      { status: 500 },
    );
  }
}
