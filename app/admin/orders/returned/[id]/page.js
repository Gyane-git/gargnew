"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, ShoppingCart, User, Truck, List, ArrowUp, Gauge } from "lucide-react";
import { getOrderById } from "@/lib/dummyOrders";

const statusOptions = ["processing", "shipped", "delivered", "cancelled"];
const paymentOptions = ["paid", "unpaid"];

const shippingCarriers = ["Nepal Can Move", "Pathao Parcel", "FedEx", "UPS", "DHL"];
const cancelReasons = ["Customer Request", "Out of Stock", "Payment Failed", "Duplicate Order", "Other"];
const paymentModeOptions = ["Cash On Delivery", "Esewa", "Nepal Pay"];

const statusBadgeStyles = {
  processing: "bg-yellow-400 text-slate-900",
  pending: "bg-slate-400 text-white",
  shipped: "bg-blue-500 text-white",
  delivered: "bg-green-500 text-white",
  cancelled: "bg-red-600 text-white",
};

const paymentBadgeStyles = {
  unpaid: "bg-red-600 text-white",
  paid: "bg-green-500 text-white",
  refunded: "bg-slate-400 text-white",
};

export default function Page({ params }) {
  const { id } = params;

  const order = getOrderById(id);

  const [orderStatus, setOrderStatus] = useState(order?.orderStatus ?? "returned");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState(order?.orderStatus ?? "processing");

  const [paymentStatus, setPaymentStatus] = useState(order?.paymentStatus ?? "unpaid");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(order?.paymentStatus ?? "paid");

  const [shippingCarrier, setShippingCarrier] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");

  const [paymentMode, setPaymentMode] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [referenceId, setReferenceId] = useState("");

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-600">Order #{id} not found.</p>
        <Link href="/admin/orders/returned" className="text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const handleUpdate = () => {
    setOrderStatus(selectedOrderStatus);
    setPaymentStatus(selectedPaymentStatus);
    console.log("Updated order", id, {
      selectedOrderStatus,
      selectedPaymentStatus,
      shippingCarrier,
      estimatedDelivery,
      deliveryDate,
      receivedBy,
      cancelReason,
      cancelNotes,
      paymentMode,
      paidAmount,
      transactionId,
      referenceId,
    });
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const inputClass = "w-full border border-slate-300 rounded px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top header bar */}
      <div className="bg-blue-50 px-8 py-5">
        <h1 className="text-2xl font-semibold text-slate-800">Order Details</h1>
        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
          <Gauge size={16} />
          <a href="#" className="text-blue-600 hover:underline">
            Dashboard
          </a>
          <span>/</span>
          <span>Order Details</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="flex-1 px-8 pb-8">
        <div className="bg-white rounded-md shadow-sm">
          {/* Order # + action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Order {order.orderId}</h2>

            <div className="flex items-center gap-3">
              <button onClick={handlePrintInvoice} className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded">
                <Printer size={16} />
                Print Invoice
              </button>
              <Link href="/admin/orders/returned" className="flex items-center gap-2 border border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded">
                <ArrowLeft size={16} />
                Back to Orders
              </Link>
            </div>
          </div>

          {/* Status row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6 border-b border-slate-100">
            {/* Left: current status labels */}
            <div className="flex flex-wrap items-start gap-8">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Order Status:</span>
                <span className="text-sm text-slate-600 capitalize">{orderStatus}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Payment Status:</span>
                <span className={`px-3 py-1 rounded text-sm font-medium capitalize ${paymentBadgeStyles[paymentStatus] || "bg-slate-400 text-white"}`}>{paymentStatus}</span>
              </div>
            </div>

            {/* Right: editable form */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <select value={selectedOrderStatus} onChange={(e) => setSelectedOrderStatus(e.target.value)} className="flex-1 border border-slate-300 rounded px-4 py-2.5 text-sm text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-blue-200">
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt} className="capitalize">
                      {opt}
                    </option>
                  ))}
                </select>

                <select value={selectedPaymentStatus} onChange={(e) => setSelectedPaymentStatus(e.target.value)} className="flex-1 border border-slate-300 rounded px-4 py-2.5 text-sm text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-blue-200">
                  {paymentOptions.map((opt) => (
                    <option key={opt} value={opt} className="capitalize">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic fields for order status */}
              {selectedOrderStatus === "shipped" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Shipping Carrier</label>
                    <select value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} className={inputClass}>
                      <option value="">Select Carrier</option>
                      {shippingCarriers.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Estimated Delivery Date</label>
                    <input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} className={inputClass} />
                  </div>
                </>
              )}

              {selectedOrderStatus === "delivered" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Delivery Date</label>
                    <input type="datetime-local" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Received By</label>
                    <input type="text" placeholder="Person who received the package" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={inputClass} />
                  </div>
                </>
              )}

              {selectedOrderStatus === "cancelled" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Cancellation Reason</label>
                    <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={inputClass}>
                      <option value="">Select Cancel Reason</option>
                      {cancelReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Additional Notes</label>
                    <textarea value={cancelNotes} onChange={(e) => setCancelNotes(e.target.value)} rows={3} className={inputClass} />
                  </div>
                </>
              )}

              {/* Dynamic fields for payment status - only show when "paid" is selected */}
              {selectedPaymentStatus === "paid" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Payment Mode</label>
                    <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputClass}>
                      <option value="">Select Payment Mode</option>
                      {paymentModeOptions.map((opt) => (
                        <option key={opt} value={opt} className="text-slate-700">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Paid Amount</label>
                    <input type="text" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Enter Paid Amount" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Transaction ID</label>
                    <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter Transaction ID" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Reference ID</label>
                    <input type="text" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="Enter Reference ID (if any)" className={inputClass} />
                  </div>
                </>
              )}

              <div>
                <button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded">
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Three info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Order Information */}
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
                  <span className={`px-3 py-1 rounded text-xs font-medium capitalize ${statusBadgeStyles[orderStatus] || "bg-slate-400 text-white"}`}>{orderStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Payment Status:</span>
                  <span className={`px-3 py-1 rounded text-xs font-medium capitalize ${paymentBadgeStyles[paymentStatus] || "bg-slate-400 text-white"}`}>{paymentStatus}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-l-4 border-blue-500 rounded shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-t">
                <User size={16} className="text-slate-700" />
                <span className="font-semibold text-slate-800">Customer Information</span>
              </div>
              <div className="px-4 py-4 space-y-3 text-sm text-slate-700">
                <p>Name: {order.customer}</p>
                <p className="break-words">Email: {order.customerInfo.email}</p>
                <p>Phone: {order.customerInfo.phone}</p>
                <p>Customer Since: {order.customerInfo.customerSince}</p>
                <p>
                  Total Orders: <span className="text-blue-600 font-medium">{order.customerInfo.totalOrders}</span>
                </p>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="border-l-4 border-blue-500 rounded shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-t">
                <Truck size={16} className="text-slate-700" />
                <span className="font-semibold text-slate-800">Shipping Information</span>
              </div>
              <div className="px-4 py-4 space-y-3 text-sm text-slate-700">
                <p>Shipping Method: {order.shippingInfo.method}</p>
                <p>Province: {order.shippingInfo.province}</p>
                <p>City: {order.shippingInfo.city}</p>
                <p>Zone: {order.shippingInfo.zone}</p>
                <p>Street Address: {order.shippingInfo.streetAddress}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
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
                    {order.items.map((item) => (
                      <tr key={item.sn} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-slate-700">{item.sn}</td>
                        <td className="py-3 px-4 text-slate-700">{item.product}</td>
                        <td className="py-3 px-4 text-right text-blue-600">{item.qty}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-slate-100">
                      <td colSpan={4} className="py-3 px-4 text-right font-semibold text-slate-800">
                        Subtotal:
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{order.summary.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td colSpan={4} className="py-3 px-4 text-right font-semibold text-slate-800">
                        Tax ({order.summary.taxRate}%):
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{order.summary.tax.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td colSpan={4} className="py-3 px-4 text-right font-semibold text-slate-800">
                        Shipping Cost:
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{order.summary.shippingCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-900">
                        Total Amount:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{order.summary.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 w-10 h-10 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg">
        <ArrowUp size={18} />
      </button>
    </div>
  );
}
