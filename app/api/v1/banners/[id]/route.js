import pool from "@/utils/db";
import { writeFile } from "fs/promises";
import path from "path";

// GET SINGLE
export async function GET(req, { params }) {
  try {
    const [rows] = await pool.query("SELECT * FROM carousel_images WHERE id = ?", [params.id]);

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true, banner: rows[0] });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// UPDATE
export async function PUT(req, { params }) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let product_code, is_offer, status;
    let newDesktopPath = null;
    let newMobilePath = null;
    let removeDesktop = false;
    let removeMobile = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      product_code = formData.get("product_code");
      is_offer = formData.get("is_offer");
      status = formData.get("status");

      // 🔥 GET REMOVE FLAGS
      removeDesktop = formData.get("remove_desktop") === "true";
      removeMobile = formData.get("remove_mobile") === "true";

      const desktopFile = formData.get("desktop_image");
      const mobileFile = formData.get("mobile_image");

      // SAVE DESKTOP IMAGE
      if (desktopFile && desktopFile.size > 0) {
        const bytes = await desktopFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `desktop_${Date.now()}_${desktopFile.name}`;
        const filePath = path.join(process.cwd(), "public/uploads/carousel", filename);
        await writeFile(filePath, buffer);
        newDesktopPath = filename;
      }

      // SAVE MOBILE IMAGE
      if (mobileFile && mobileFile.size > 0) {
        const bytes = await mobileFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `mobile_${Date.now()}_${mobileFile.name}`;
        const filePath = path.join(process.cwd(), "public/uploads/carousel", filename);
        await writeFile(filePath, buffer);
        newMobilePath = filename;
      }
    } else {
      const body = await req.json();
      product_code = body.product_code;
      is_offer = body.is_offer;
      status = body.status;
    }

    // GET CURRENT DATA
    const [rows] = await pool.query("SELECT * FROM carousel_images WHERE id = ?", [params.id]);

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Banner not found" }, { status: 404 });
    }

    const current = rows[0];

    // 🔥 MAIN FIX LOGIC
    let finalDesktopPath = current.file_path;
    let finalMobilePath = current.mobile_file_path;

    // REMOVE IMAGE
    if (removeDesktop) finalDesktopPath = null;
    if (removeMobile) finalMobilePath = null;

    // REPLACE WITH NEW IMAGE
    if (newDesktopPath) finalDesktopPath = newDesktopPath;
    if (newMobilePath) finalMobilePath = newMobilePath;

    await pool.query(
      `UPDATE carousel_images 
       SET product_code=?, file_path=?, mobile_file_path=?, is_offer=?, status=? 
       WHERE id=?`,
      [product_code, finalDesktopPath, finalMobilePath, is_offer ?? 0, status ?? 1, params.id],
    );

    return Response.json({ success: true, message: "Updated successfully" });
  } catch (err) {
    console.error("PUT error:", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { status } = await req.json();

    await pool.query("UPDATE carousel_images SET status=? WHERE id=?", [status, params.id]);

    return Response.json({
      success: true,
      message: "Status updated",
    });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    await pool.query("DELETE FROM carousel_images WHERE id = ?", [params.id]);
    return Response.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
