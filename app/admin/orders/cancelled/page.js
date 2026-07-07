import OrderListPage from "@/components/admin-orders/OrderListPage";

export default function Page() {
  return (
    <OrderListPage
      title="Cancelled Orders"
      subtitle="Cancelled Orders"
      status="cancelled"
      linkPrefix="/admin/orders/cancelled"
      exportFilePrefix="cancelled-orders"
    />
  );
}
