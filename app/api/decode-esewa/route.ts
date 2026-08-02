import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/decode-esewa:
 *   get:
 *     summary: Decode a base64-encoded JSON payload (e.g. eSewa's response "data" query param) back into an object
 *     tags: [Payment]
 *     parameters:
 *       - { name: data, in: query, required: true, schema: { type: string }, description: Base64-encoded JSON string. }
 *     responses:
 *       200: { description: 'Returns { decoded, success: true } when data is valid base64 JSON, or { error, success: false } when the "data" query parameter is missing, or { error, success: true } when decoding/parsing fails (note - success is true even on parse failure in the current implementation).' }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");

  if (!data) {
    return NextResponse.json({
      error: 'Missing "data" query parameter',
      success: false,
    });
  }

  try {
    const jsonStr = Buffer.from(data, "base64").toString("utf-8");
    const parsedData = JSON.parse(jsonStr);
    // console.log(parsedData);

    return NextResponse.json({ decoded: parsedData, success: true });
  } catch (error) {
    return NextResponse.json({
      error: "Invalid Base64 or JSON format",
      success: true,
    });
  }
}
