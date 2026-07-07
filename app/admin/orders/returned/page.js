import OrderListPage from "@/components/admin-orders/OrderListPage";

export default function Page() {
  return (
    <OrderListPage
      title="Returned Orders"
      subtitle="Returned Orders"
      status="returned"
      linkPrefix="/admin/orders/returned"
      exportFilePrefix="returned-orders"
    />
  );
}
