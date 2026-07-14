import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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
