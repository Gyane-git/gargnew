/**
 * @swagger
 * /api/google-auth:
 *   post:
 *     summary: Proxy a Google social login/registration request to the backend social auth endpoint (/api/v1/auth/social/google-register) and return its response
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Forwarded as-is to the backend google-register endpoint.
 *     responses:
 *       200: { description: Response proxied directly from the backend social auth endpoint (status code also mirrors the backend response). }
 *       500: { description: '{ success: false, errors: [{ message: "Failed to authenticate." }] } returned when the request body could not be parsed or the backend call failed.' }
 */
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
