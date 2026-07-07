import OrderListPage from "@/components/admin-orders/OrderListPage";

export default function Page() {
  return (
    <OrderListPage
      title="Shipped Orders"
      subtitle="Shipped Orders"
      status="shipped"
      linkPrefix="/admin/orders/shipped"
      exportFilePrefix="shipped-orders"
    />
  );
}
