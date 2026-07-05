export async function POST(req) {
  try {
    const body = await req.json();
    const backendRes = await fetch(new URL("/api/v1/auth/social/google-register", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return Response.json(data, { status: backendRes.status });
  } catch (error) {
    return Response.json({ success: false, errors: [{ message: "Failed to authenticate." }] }, { status: 500 });
  }
}
