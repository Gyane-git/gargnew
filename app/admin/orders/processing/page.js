import OrderListPage from "@/components/admin-orders/OrderListPage";

export default function Page() {
  return (
    <OrderListPage
      title="Processing Orders"
      subtitle="Processing Orders"
      status="processing"
      linkPrefix="/admin/orders/processing"
      exportFilePrefix="processing-orders"
    />
  );
}
