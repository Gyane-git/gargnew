import { NextResponse } from "next/server";
import { getApiDocs, getApiDocsByTag } from "@/utils/swagger";

/**
 * @swagger
 * /api/api-docs:
 *   get:
 *     summary: Get the generated OpenAPI/Swagger specification for this API, consumed by the /api-docs Swagger UI page
 *     tags: [Docs]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         required: false
 *         description: When provided, narrows the spec to only the operations carrying this @swagger tag.
 *     responses:
 *       200:
 *         description: The OpenAPI JSON specification document (full, or narrowed to `tag`).
 */
// Serves the generated OpenAPI spec consumed by the /api-docs Swagger UI page.
// Pass ?tag=Products (etc) to get a narrowed spec instead of the entire API tree.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  return NextResponse.json(tag ? getApiDocsByTag(tag) : getApiDocs());
}
