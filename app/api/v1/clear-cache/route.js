import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * @swagger
 * /api/v1/clear-cache:
 *   post:
 *     summary: Revalidate cached pages
 *     description: Calls Next.js revalidatePath for "/", "/products", and "/hot-sales".
 *       No request body is read.
 *     tags: [Misc]
 *     responses:
 *       200: { description: '{ success: true, message: "Cache cleared successfully." }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function POST() {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/hot-sales");

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
