import pool from "@/utils/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET SINGLE OFFER
export async function GET(req, { params }) {
  try {
    const [rows] = await pool.query("SELECT * FROM offers WHERE id = ?", [params.id]);

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Offer not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      offer: rows[0],
    });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// UPDATE OFFER
export async function PUT(req, { params }) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let title, start_date, end_date, is_active;
    let newImage = null;
    let removeImage = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      title = formData.get("title");
      start_date = formData.get("start_date");
      end_date = formData.get("end_date");
      is_active = formData.get("is_active");

      removeImage = formData.get("remove_image") === "true";

      const image = formData.get("offer_image");

      if (image && image.size > 0) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `offer_${Date.now()}_${image.name}`;

        const uploadDir = path.join(process.cwd(), "public/uploads/offers");

        await mkdir(uploadDir, { recursive: true });

        await writeFile(path.join(uploadDir, filename), buffer);

        newImage = filename;
      }
    } else {
      const body = await req.json();

      title = body.title;
      start_date = body.start_date;
      end_date = body.end_date;
      is_active = body.is_active;
    }

    const [rows] = await pool.query("SELECT * FROM offers WHERE id=?", [params.id]);

    if (!rows.length) {
      return Response.json({ success: false, message: "Offer not found" }, { status: 404 });
    }

    const current = rows[0];

    let finalImage = current.offer_image;

    if (removeImage) finalImage = null;

    if (newImage) finalImage = newImage;

    await pool.query(
      `UPDATE offers
       SET title=?,
           offer_image=?,
           start_date=?,
           end_date=?,
           is_active=?
       WHERE id=?`,
      [title, finalImage, start_date || null, end_date || null, is_active ?? 1, params.id],
    );

    return Response.json({
      success: true,
      message: "Offer updated successfully",
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: 500,
      },
    );
  }
}

// UPDATE STATUS
export async function PATCH(req, { params }) {
  try {
    const { is_active } = await req.json();

    await pool.query("UPDATE offers SET is_active=? WHERE id=?", [is_active, params.id]);

    return Response.json({
      success: true,
      message: "Status updated",
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: 500,
      },
    );
  }
}

// DELETE OFFER
export async function DELETE(req, { params }) {
  try {
    await pool.query("DELETE FROM offers WHERE id=?", [params.id]);

    return Response.json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: 500,
      },
    );
  }
}
