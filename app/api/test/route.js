import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Simple health-check/test endpoint
 *     tags: [Misc]
 *     responses:
 *       200: { description: '{ message: "Hello found" }' }
 */
export async function GET() {
  return NextResponse.json({ message: "Hello found" });
}
