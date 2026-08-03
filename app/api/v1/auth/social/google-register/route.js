import { handleGoogleLogin } from "@/utils/googleAuth";

export async function POST(req) {
  try {
    const body = await req.json();
    const result = await handleGoogleLogin(body);
    return Response.json(result, { status: result.status || 200 });
  } catch (error) {
    return Response.json(
      {
        success: false,
        errors: [{ message: error.message || "Google registration failed." }],
      },
      { status: 500 },
    );
  }
}
