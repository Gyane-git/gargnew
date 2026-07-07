import OrderListPage from "@/components/admin-orders/OrderListPage";

export default function Page() {
  return (
    <OrderListPage
      title="Delivered Orders"
      subtitle="Delivered Orders"
      status="delivered"
      linkPrefix="/admin/orders/delivered"
      exportFilePrefix="delivered-orders"
    />
  );
}
