import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/dummy-data:
 *   get:
 *     summary: Generate a dummy payment payload (amount, product name, random transaction id) for testing the eSewa or Khalti payment flows
 *     tags: [Payment]
 *     parameters:
 *       - { name: method, in: query, required: true, schema: { type: string, enum: [esewa, khalti] } }
 *     responses:
 *       200: { description: 'Returns { amount, productName, transactionId } for the requested method.' }
 *       400: { description: '{ error: "Invalid payment method" } returned when method is missing or not esewa/khalti.' }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const method = searchParams.get("method");

  const generateId = () => Math.random().toString(36).substr(2, 9);

  switch (method) {
    case "esewa":
      return NextResponse.json({
        amount: "100",
        productName: "eSewa Test Product",
        transactionId: `ESEWA-${generateId()}`,
      });

    case "khalti":
      return NextResponse.json({
        amount: "200",
        productName: "Khalti Test Product",
        transactionId: `KHALTI-${generateId()}`,
      });

    default:
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
  }
}
