import OrderDetailsPage from "@/components/admin-orders/OrderDetailsPage";

export default async function Page({ params }) {
  const { id } = await params;
  return <OrderDetailsPage orderId={id} backHref="/admin/orders/returned" title="Returned Order Details" />;
}
