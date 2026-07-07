import pool from "@/utils/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ABOUT_US_KEY = "about_us";
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/about-us");

async function readAboutUsRow() {
  const [rows] = await pool.query("SELECT id, `value` FROM compliances WHERE `key` = ? LIMIT 1", [ABOUT_US_KEY]);
  return rows[0] || null;
}

function normalizeStoredValue(rawValue) {
  if (!rawValue) return null;

  if (typeof rawValue === "object") return rawValue;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function buildResponseData(value) {
  const story = value?.story || {};
  const title = value?.title || "About Garg Dental";
  const youtubeLink = value?.youtubeLink || "";
  const introVideoUrl = value?.introVideoUrl || "";
  const aboutUsContent = value?.aboutUsContent || "";

  const storyTitle = story?.title || "Our Story";
  const storyName = story?.name || "";
  const storyDesignation = story?.designation || "";
  const storyImageUrl = story?.imageUrl || "";
  const storyDescription = story?.description || "";

  return {
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
    about_us_title: title,
    about_us: aboutUsContent,
    youtube_video: youtubeLink,
    introduction_video_url: introVideoUrl,
    story_title: storyTitle,
    stories: [
      {
        name: storyName,
        designation: storyDesignation,
        image: storyImageUrl,
        description: storyDescription,
      },
    ],
  };
}

async function removeUploadedFile(fileUrl) {
  if (!fileUrl) return;

  const relativePath = String(fileUrl).replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    await fs.unlink(absolutePath);
  } catch {
    // Ignore missing files during cleanup.
  }
}

export async function GET() {
  try {
    const row = await readAboutUsRow();

    if (!row) {
      return Response.json({
        success: true,
        data: null,
      });
    }

    const parsed = normalizeStoredValue(row.value);

    return Response.json({
      success: true,
      data: parsed ? buildResponseData(parsed) : null,
    });
  } catch (error) {
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

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const existingRow = await readAboutUsRow();
    const existingData = normalizeStoredValue(existingRow?.value);

    let introVideoUrl = existingData?.introVideoUrl || "";
    let storyImageUrl = existingData?.story?.imageUrl || "";

    if (introVideo && introVideo.size > 0) {
      const extension = path.extname(introVideo.name);
      const fileName = `${randomUUID()}${extension}`;
      await fs.writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await introVideo.arrayBuffer()));
      introVideoUrl = `/uploads/about-us/${fileName}`;
    }

    if (storyImage && storyImage.size > 0) {
      const extension = path.extname(storyImage.name);
      const fileName = `${randomUUID()}${extension}`;
      await fs.writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await storyImage.arrayBuffer()));
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

    if (existingRow?.id) {
      await pool.query("UPDATE compliances SET `value` = ?, updated_at = NOW() WHERE `key` = ?", [JSON.stringify(value), ABOUT_US_KEY]);
    } else {
      await pool.query("INSERT INTO compliances (`key`, `value`, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", [ABOUT_US_KEY, JSON.stringify(value)]);
    }

    return Response.json({
      success: true,
      message: "About Us saved successfully.",
      data: buildResponseData(value),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const row = await readAboutUsRow();
    const parsed = normalizeStoredValue(row?.value);

    if (!row) {
      return Response.json({
        success: true,
        message: "About Us content deleted successfully.",
      });
    }

    const introVideoUrl = parsed?.introVideoUrl || "";
    const storyImageUrl = parsed?.story?.imageUrl || "";

    await pool.query("DELETE FROM compliances WHERE `key` = ?", [ABOUT_US_KEY]);

    await removeUploadedFile(introVideoUrl);
    await removeUploadedFile(storyImageUrl);

    return Response.json({
      success: true,
      message: "About Us content deleted successfully.",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
