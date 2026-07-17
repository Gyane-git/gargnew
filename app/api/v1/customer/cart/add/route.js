import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import {
  formatCartItem,
  formatCartResponse,
  ensureCartItemVariationColumn,
  getCustomerCartId,
  getProductByCode,
  getProductVariationByKey,
} from "@/utils/cart";

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const productCode = String(body.product_code || "").trim();
    const variationKey = String(body.variation_key || body.variation_sku || "").trim() || null;
    const quantity = Number(body.quantity || 1);
    const price = Number(body.price || 0);

    if (!productCode) {
      return Response.json({ success: false, message: "product_code is required" }, { status: 400 });
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      return Response.json({ success: false, message: "quantity must be at least 1" }, { status: 422 });
    }

    await ensureCartItemVariationColumn(pool);

    const product = variationKey
      ? (await getProductVariationByKey(productCode, variationKey)) || (await getProductByCode(productCode))
      : await getProductByCode(productCode);
    if (!product) {
      return Response.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const maxQty = Number(product.available_quantity || product.stock_quantity || 0);
    if (maxQty > 0 && quantity > maxQty) {
      return Response.json(
        {
          success: false,
          message: `Only ${maxQty} items available in stock.`,
        },
        { status: 422 },
      );
    }

    const cartId = await getCustomerCartId(pool, authUser.id, true);

    const [existing] = await pool.query(
      "SELECT id, quantity, price, actual_price FROM cart_items WHERE cart_id = ? AND product_code = ? AND COALESCE(variation_key, '') = COALESCE(?, '') LIMIT 1",
      [cartId, productCode, variationKey],
    );

    if (existing.length > 0) {
      const nextQuantity = Number(existing[0].quantity || 0) + quantity;
      const nextPrice = price > 0 ? price : Number(product.sell_price || product.actual_price || 0);
      if (maxQty > 0 && nextQuantity > maxQty) {
        return Response.json(
          {
            success: false,
            message: `Only ${maxQty} items available in stock.`,
          },
          { status: 422 },
        );
      }
      await pool.query(
        "UPDATE cart_items SET quantity = ?, price = ?, actual_price = ?, variation_key = ?, updated_at = NOW() WHERE id = ?",
        [nextQuantity, nextPrice, Number(product.actual_price || 0), variationKey, existing[0].id],
      );
    } else {
      const itemPrice = price > 0 ? price : Number(product.sell_price || product.actual_price || 0);
      await pool.query(
        "INSERT INTO cart_items (cart_id, product_code, variation_key, quantity, price, actual_price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [cartId, productCode, variationKey, quantity, itemPrice, Number(product.actual_price || 0)],
      );
    }

    const [rows] = await pool.query(
      `SELECT id, cart_id, product_code, variation_key, quantity, price, actual_price, created_at, updated_at
       FROM cart_items
       WHERE cart_id = ?
       ORDER BY id DESC`,
      [cartId],
    );

    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        product: row.variation_key
          ? (await getProductVariationByKey(row.product_code, row.variation_key)) || (await getProductByCode(row.product_code))
          : await getProductByCode(row.product_code),
      })),
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
