import { NextResponse } from "next/server";
import { getApiTags } from "@/utils/swagger";

/**
 * @swagger
 * /api/api-docs/tags:
 *   get:
 *     summary: List the distinct @swagger tags used across the API, used to populate the "Select a definition" dropdown on the /api-docs Swagger UI page
 *     tags: [Docs]
 *     responses:
 *       200:
 *         description: Sorted array of tag names.
 */
export async function GET() {
  return NextResponse.json(getApiTags());
}
