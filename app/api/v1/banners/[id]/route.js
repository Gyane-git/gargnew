import pool from "@/utils/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET SINGLE
/**
 * @swagger
 * /api/v1/banners/{id}:
 *   get:
 *     summary: Get a single carousel banner by id
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Banner found.
 *       404:
 *         description: Not found.
 *       500:
 *         description: Server error.
 */
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
/**
 * @swagger
 * /api/v1/banners/{id}:
 *   put:
 *     summary: Update a carousel banner
 *     description: Accepts either multipart/form-data (to optionally replace and/or remove the
 *       desktop and/or mobile image) or a plain JSON body with product_code/is_offer/status.
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product_code: { type: string }
 *               is_offer: { type: string }
 *               status: { type: string }
 *               remove_desktop: { type: string, description: "Pass \"true\" to remove the existing desktop image." }
 *               remove_mobile: { type: string, description: "Pass \"true\" to remove the existing mobile image." }
 *               desktop_image: { type: string, format: binary }
 *               mobile_image: { type: string, format: binary }
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_code: { type: string }
 *               is_offer: { type: integer }
 *               status: { type: integer }
 *     responses:
 *       200:
 *         description: Updated successfully.
 *       404:
 *         description: Banner not found.
 *       500:
 *         description: Server error.
 */
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
        const uploadDir = path.join(process.cwd(), "public/uploads/carousel");
        const filePath = path.join(uploadDir, filename);
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
        newDesktopPath = filename;
      }

      // SAVE MOBILE IMAGE
      if (mobileFile && mobileFile.size > 0) {
        const bytes = await mobileFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `mobile_${Date.now()}_${mobileFile.name}`;
        const uploadDir = path.join(process.cwd(), "public/uploads/carousel");
        const filePath = path.join(uploadDir, filename);
        await mkdir(uploadDir, { recursive: true });
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

/**
 * @swagger
 * /api/v1/banners/{id}:
 *   patch:
 *     summary: Update a carousel banner's status
 *     description: Accepts a JSON body { status } and updates only the status column.
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: integer }
 *             required: [status]
 *     responses:
 *       200:
 *         description: Status updated.
 *       500:
 *         description: Server error.
 */
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
/**
 * @swagger
 * /api/v1/banners/{id}:
 *   delete:
 *     summary: Delete a carousel banner
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted successfully.
 *       500:
 *         description: Server error.
 */
export async function DELETE(req, { params }) {
  try {
    await pool.query("DELETE FROM carousel_images WHERE id = ?", [params.id]);
    return Response.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
