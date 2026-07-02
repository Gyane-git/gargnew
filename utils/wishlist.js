import { getProductByCode } from "@/utils/cart";

export const formatWishlistItem = async (row) => ({
  id: row.id,
  customer_id: row.customer_id,
  product_code: row.product_code,
  created_at: row.created_at,
  updated_at: row.updated_at,
  product: await getProductByCode(row.product_code),
});

