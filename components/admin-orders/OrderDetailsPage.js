"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Gauge, List, Printer, ShoppingCart, Truck, User } from "lucide-react";
import toast from "react-hot-toast";

const statusOptions = ["processing", "shipped", "delivered", "cancelled", "returned"];
const paymentOptions = ["unpaid", "paid"];
const paymentModes = ["COD", "Connectips", "fonepay", "wallet"];

const statusBadgeStyles = {
  processing: "bg-yellow-400 text-slate-900",
  pending: "bg-slate-400 text-white",
  shipped: "bg-blue-500 text-white",
  delivered: "bg-green-500 text-white",
  cancelled: "bg-red-600 text-white",
  returned: "bg-slate-600 text-white",
};

const paymentBadgeStyles = {
  unpaid: "bg-red-600 text-white",
  paid: "bg-green-500 text-white",
  refunded: "bg-slate-400 text-white",
};

const formatCurrency = (value) => Number(value || 0).toFixed(2);

export default function OrderDetailsPage({ orderId, backHref, title = "Order Details" }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedOrderStatus, setSelectedOrderStatus] = useState("processing");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("unpaid");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippingCarriers, setShippingCarriers] = useState([]);
  const [cancelReasons, setCancelReasons] = useState([]);
  const [selectedCancelReasonId, setSelectedCancelReasonId] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [message, setMessage] = useState("");

  const loadOrder = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/admin/orders/${orderId}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load order.");
      }

      setOrder(data.order);
      setSelectedOrderStatus(data.order?.orderStatus || "processing");
      setSelectedPaymentStatus(data.order?.paymentStatus || "unpaid");
      setSelectedPaymentMode(data.order?.paymentMethod || "");
      setShippingCarrier(data.order?.shippingCarrier || "");
    } catch (err) {
      setError(err.message || "Failed to load order.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    setSelectedOrderStatus(order.orderStatus || "processing");
    setSelectedPaymentStatus(order.paymentStatus || "unpaid");
    if (order.paymentMethod) setSelectedPaymentMode(order.paymentMethod);
    if (order.shippingCarrier) setShippingCarrier(order.shippingCarrier);
  }, [order]);

  useEffect(() => {
    const loadCarriers = async () => {
      try {
        const response = await fetch("/api/shipping-carriers", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load carriers.");
        }

        const items = Array.isArray(data.carriers) ? data.carriers.filter((carrier) => Number(carrier.publish ?? 1) === 1) : [];
        setShippingCarriers(items);
      } catch (err) {
        console.error(err);
        setShippingCarriers([]);
      }
    };

    loadCarriers();
  }, []);

  useEffect(() => {
    const loadCancelReasons = async () => {
      try {
        const response = await fetch("/api/v1/order-cancel-reasons", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load cancellation reasons.");
        }

        const items = Array.isArray(data.reasons)
          ? data.reasons.filter(
              (reason) =>
                String(reason.reason_type || "").trim().toLowerCase() === "cancel" &&
                String(reason.reason_for || "").trim().toLowerCase() === "supplier",
            )
          : [];

        setCancelReasons(items);
      } catch (err) {
        console.error(err);
        setCancelReasons([]);
      }
    };

    loadCancelReasons();
  }, []);

  const statusLabel = useMemo(() => selectedOrderStatus || "processing", [selectedOrderStatus]);
  const paymentLabel = useMemo(() => selectedPaymentStatus || "unpaid", [selectedPaymentStatus]);

  const handleUpdate = async () => {
    if (!order) return;

    if (selectedOrderStatus === "cancelled" && !selectedCancelReasonId) {
      toast.error("Please select a cancellation reason.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        order_status: selectedOrderStatus,
        payment_status: selectedPaymentStatus,
        payment_mode: selectedPaymentMode,
        shipping_carrier: shippingCarrier,
        estimated_delivery_date: estimatedDelivery,
        delivery_date: deliveryDate,
        received_by: receivedBy,
        cancel_reason_id: selectedOrderStatus === "cancelled" ? selectedCancelReasonId : "",
        cancel_reason:
          selectedOrderStatus === "cancelled"
            ? cancelReasons.find((reason) => String(reason.id) === String(selectedCancelReasonId))?.reason_name || ""
            : "",
        cancel_notes: cancelNotes,
        paid_amount: paidAmount,
        transaction_id: transactionId,
        reference_id: referenceId,
      };

      const response = await fetch(`/api/v1/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update order.");
      }

      const successMessage = data.message || "Order updated successfully.";
      setMessage(successMessage);
      toast.success(successMessage);
      await loadOrder();
    } catch (err) {
      const errorMessage = err.message || "Failed to update order.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const inputClass = "w-full border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-600">{error}</p>
        <Link href={backHref} className="text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-blue-50 px-8 py-5">
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
          <Gauge size={16} />
          <a href="#" className="text-blue-600 hover:underline">
            Dashboard
          </a>
          <span>/</span>
          <span>{title}</span>
        </div>
      </div>

      <div className="flex-1 px-8 pb-8">
        <div className="bg-white rounded-md shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Order {order.orderId}</h2>

            <div className="flex items-center gap-3">
              <button onClick={handlePrintInvoice} className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded">
                <Printer size={16} />
                Print Invoice
              </button>
              <Link href={backHref} className="flex items-center gap-2 border border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded">
                <ArrowLeft size={16} />
                Back to Orders
              </Link>
            </div>
          </div>

          <div className="px-6 py-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex flex-wrap items-center gap-6 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Order Status:</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium capitalize ${statusBadgeStyles[statusLabel] || "bg-slate-400 text-white"}`}>{statusLabel}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Payment Status:</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium capitalize ${paymentBadgeStyles[paymentLabel] || "bg-slate-400 text-white"}`}>{paymentLabel}</span>
                </div>
              </div>

              <div className="w-full md:w-[420px]">
                <div className="grid grid-cols-2 gap-3">
                  <select value={selectedOrderStatus} onChange={(e) => setSelectedOrderStatus(e.target.value)} className="border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-blue-200 w-full">
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt} className="capitalize">
                        {opt}
                      </option>
                    ))}
                  </select>

                  <select value={selectedPaymentStatus} onChange={(e) => setSelectedPaymentStatus(e.target.value)} className="border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-blue-200 w-full">
                    {paymentOptions.map((opt) => (
                      <option key={opt} value={opt} className="capitalize">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOrderStatus === "shipped" && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Shipping Carrier</label>
                      <select value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} className={inputClass}>
                        <option value="">Select Carrier</option>
                        {shippingCarriers.map((carrier) => (
                          <option key={carrier.id} value={carrier.name}>
                            {carrier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Estimated Delivery Date</label>
                      <input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                )}

                {selectedOrderStatus === "delivered" && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Delivery Date</label>
                      <input type="datetime-local" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Received By</label>
                      <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={inputClass} placeholder="Receiver name" />
                    </div>
                  </div>
                )}

                {selectedOrderStatus === "cancelled" && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Cancellation Reason</label>
                      <select
                        value={selectedCancelReasonId}
                        onChange={(e) => setSelectedCancelReasonId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select Reason</option>
                        {cancelReasons.map((reason) => (
                          <option key={reason.id} value={reason.id}>
                            {reason.reason_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Additional Notes</label>
                      <textarea value={cancelNotes} onChange={(e) => setCancelNotes(e.target.value)} rows={3} className={inputClass} />
                    </div>
                  </div>
                )}

                {selectedPaymentStatus === "paid" && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Payment Mode</label>
                      <select value={selectedPaymentMode} onChange={(e) => setSelectedPaymentMode(e.target.value)} className={inputClass}>
                        <option value="">Select Payment Mode</option>
                        {paymentModes.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Paid Amount</label>
                      <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className={inputClass} placeholder="Enter amount" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Transaction ID</label>
                      <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className={inputClass} placeholder="Transaction ID" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Reference ID</label>
                      <input type="text" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} className={inputClass} placeholder="Reference ID" />
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <button onClick={handleUpdate} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-8 py-3 rounded">
                    {saving ? "Updating..." : "Update"}
                  </button>
                  {message ? <span className="text-sm text-green-600">{message}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="border-l-4 border-blue-500 rounded shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-t">
                <ShoppingCart size={16} className="text-slate-700" />
                <span className="font-semibold text-slate-800">Order Information</span>
              </div>
              <div className="px-4 py-4 space-y-3 text-sm text-slate-700">
                <p>Order ID: {order.orderId.replace("#", "")}</p>
                <p>Order Date: {order.orderDate}</p>
                <div className="flex items-center gap-2">
                  <span>Order Status:</span>
                  <span className={`px-3 py-1 rounded text-xs font-medium capitalize ${statusBadgeStyles[order.orderStatus] || "bg-slate-400 text-white"}`}>{order.orderStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Payment Status:</span>
                  <span className={`px-3 py-1 rounded text-xs font-medium capitalize ${paymentBadgeStyles[order.paymentStatus] || "bg-slate-400 text-white"}`}>{order.paymentStatus}</span>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 rounded shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-t">
                <User size={16} className="text-slate-700" />
                <span className="font-semibold text-slate-800">Customer Information</span>
              </div>
              <div className="px-4 py-4 space-y-3 text-sm text-slate-700">
                <p>Name: {order.customer}</p>
                <p className="break-words">Email: {order.customerInfo?.email || ""}</p>
                <p>Phone: {order.customerInfo?.phone || ""}</p>
                <p>Customer Since: {order.customerInfo?.customerSince || ""}</p>
                <p>
                  Total Orders: <span className="text-blue-600 font-medium">{order.customerInfo?.totalOrders || 0}</span>
                </p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 rounded shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-t">
                <Truck size={16} className="text-slate-700" />
                <span className="font-semibold text-slate-800">Shipping Information</span>
              </div>
              <div className="px-4 py-4 space-y-3 text-sm text-slate-700">
                <p>Shipping Method: {order.shippingInfo?.method || ""}</p>
                <p>Province: {order.shippingInfo?.province || ""}</p>
                <p>City: {order.shippingInfo?.city || ""}</p>
                <p>Zone: {order.shippingInfo?.zone || ""}</p>
                <p>Street Address: {order.shippingInfo?.streetAddress || ""}</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="border-l-4 border-blue-500 rounded shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-t">
                <List size={16} className="text-slate-700" />
                <span className="font-semibold text-slate-800">Order Items</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left font-semibold text-slate-700 py-3 px-4">#</th>
                      <th className="text-left font-semibold text-slate-700 py-3 px-4">Product</th>
                      <th className="text-right font-semibold text-slate-700 py-3 px-4">Qty</th>
                      <th className="text-right font-semibold text-slate-700 py-3 px-4">Unit Price</th>
                      <th className="text-right font-semibold text-slate-700 py-3 px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).length ? (
                      order.items.map((item) => (
                        <tr key={`${item.sn}-${item.product_code}-${item.variation_key || ""}`} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-slate-700">{item.sn}</td>
                          <td className="py-3 px-4 text-slate-700">
                            <div>{item.product}</div>
                            {item.variation_name ? (
                              <div className="text-xs text-slate-500 mt-0.5">Variation: {item.variation_name}</div>
                            ) : null}
                          </td>
                          <td className="py-3 px-4 text-right text-blue-600">{item.qty}</td>
                          <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No items found.
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-100">
                      <td colSpan={4} className="py-3 px-4 text-right font-semibold text-slate-800">
                        Subtotal:
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(order.summary?.subtotal)}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td colSpan={4} className="py-3 px-4 text-right font-semibold text-slate-800">
                        Tax ({order.summary?.taxRate || 0}%):
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(order.summary?.tax)}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td colSpan={4} className="py-3 px-4 text-right font-semibold text-slate-800">
                        Shipping Cost:
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(order.summary?.shippingCost)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-900">
                        Total Amount:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(order.summary?.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-sm text-slate-500 py-4">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>

      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 w-10 h-10 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg">
        <ArrowUp size={18} />
      </button>
    </div>
  );
}
