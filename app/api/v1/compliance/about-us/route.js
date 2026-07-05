import pool from "@/utils/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT `value` FROM compliances WHERE `key`=?", ["about_us"]);

    if (!rows.length) {
      return Response.json({
        success: true,
        data: null,
      });
    }

    let data;

    try {
      data = JSON.parse(rows[0].value);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      data = null;
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const title = formData.get("title");
    const youtubeLink = formData.get("youtubeLink");
    const aboutUsContent = formData.get("aboutUsContent");

    const storyTitle = formData.get("storyTitle");
    const storyName = formData.get("storyName");
    const storyDesignation = formData.get("storyDesignation");
    const storyDescription = formData.get("storyDescription");

    const introVideo = formData.get("introVideo");
    const storyImage = formData.get("storyImage");

    const uploadDir = path.join(process.cwd(), "public/uploads/about-us");

    await fs.mkdir(uploadDir, { recursive: true });

    let introVideoUrl = "";
    let storyImageUrl = "";

    // Upload Intro Video
    if (introVideo && introVideo.size > 0) {
      const extension = path.extname(introVideo.name);
      const fileName = `${randomUUID()}${extension}`;

      await fs.writeFile(path.join(uploadDir, fileName), Buffer.from(await introVideo.arrayBuffer()));

      introVideoUrl = `/uploads/about-us/${fileName}`;
    }

    // Upload Story Image
    if (storyImage && storyImage.size > 0) {
      const extension = path.extname(storyImage.name);
      const fileName = `${randomUUID()}${extension}`;

      await fs.writeFile(path.join(uploadDir, fileName), Buffer.from(await storyImage.arrayBuffer()));

      storyImageUrl = `/uploads/about-us/${fileName}`;
    }

    const value = {
      title,
      youtubeLink,
      introVideoUrl,
      aboutUsContent,

      story: {
        title: storyTitle,
        name: storyName,
        designation: storyDesignation,
        imageUrl: storyImageUrl,
        description: storyDescription,
      },
    };

    const [rows] = await pool.query("SELECT id FROM compliances WHERE `key`=?", ["about_us"]);

    if (rows.length) {
      await pool.query("UPDATE compliances SET `value`=?,updated_at=NOW() WHERE `key`=?", [JSON.stringify(value), "about_us"]);
    } else {
      await pool.query("INSERT INTO compliances (`key`,`value`,created_at,updated_at) VALUES (?,?,NOW(),NOW())", ["about_us", JSON.stringify(value)]);
    }

    return Response.json({
      success: true,
      message: "About Us saved successfully.",
      data: value,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
