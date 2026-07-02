import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import {
  formatCartItem,
  formatCartResponse,
  getCustomerCartId,
  getProductByCode,
} from "@/utils/cart";

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const productCode = String(body.product_code || "").trim();
    const quantity = Number(body.quantity || 1);
    const price = Number(body.price || 0);

    if (!productCode) {
      return Response.json({ success: false, message: "product_code is required" }, { status: 400 });
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      return Response.json({ success: false, message: "quantity must be at least 1" }, { status: 422 });
    }

    const product = await getProductByCode(productCode);
    if (!product) {
      return Response.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const cartId = await getCustomerCartId(pool, authUser.id, true);

    const [existing] = await pool.query(
      "SELECT id, quantity, price, actual_price FROM cart_items WHERE cart_id = ? AND product_code = ? LIMIT 1",
      [cartId, productCode],
    );

    if (existing.length > 0) {
      const nextQuantity = Number(existing[0].quantity || 0) + quantity;
      const nextPrice = price > 0 ? price : Number(product.sell_price || product.actual_price || 0);
      await pool.query(
        "UPDATE cart_items SET quantity = ?, price = ?, actual_price = ?, updated_at = NOW() WHERE id = ?",
        [nextQuantity, nextPrice, Number(product.actual_price || 0), existing[0].id],
      );
    } else {
      const itemPrice = price > 0 ? price : Number(product.sell_price || product.actual_price || 0);
      await pool.query(
        "INSERT INTO cart_items (cart_id, product_code, quantity, price, actual_price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        [cartId, productCode, quantity, itemPrice, Number(product.actual_price || 0)],
      );
    }

    const [rows] = await pool.query(
      `SELECT id, cart_id, product_code, quantity, price, actual_price, created_at, updated_at
       FROM cart_items
       WHERE cart_id = ?
       ORDER BY id DESC`,
      [cartId],
    );

    const items = await Promise.all(
      rows.map(async (row) => ({ ...row, product: await getProductByCode(row.product_code) })),
    );

    return Response.json({
      success: true,
      message: "Product added to cart successfully.",
      cart: formatCartResponse(items.map(formatCartItem)),
    });
  } catch (error) {
    console.error("CART ADD ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
