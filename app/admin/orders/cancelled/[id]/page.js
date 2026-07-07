import OrderDetailsPage from "@/components/admin-orders/OrderDetailsPage";

export default async function Page({ params }) {
  const { id } = await params;
  return <OrderDetailsPage orderId={id} backHref="/admin/orders/cancelled" title="Cancelled Order Details" />;
}
