export interface InvoiceCustomer {
  full_name: string;
  email: string;
  phone: string;
  created_at: string | Date;
}

export interface InvoiceZone {
  zone_name: string;
}

export interface InvoiceCity {
  city: string;
}

export interface InvoiceProvince {
  province_name: string;
}

export interface InvoiceDeliveryInformation {
  address: string;
  zone: InvoiceZone;
  city: InvoiceCity;
  province: InvoiceProvince;
}

export interface InvoiceProduct {
  product_name: string;
  sku?: string | null;
}

export interface InvoiceOrderItem {
  product: InvoiceProduct;
  quantity: number;
  actual_price: number;
  subtotal_without_tax: number;
}

export interface InvoiceOrderPayment {
  due_amount: number;
}

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "paid" | "unpaid";

export interface InvoiceOrder {
  order_id: string | number;
  created_at: string | Date;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  total_items: number;
  delivered_at?: string | Date | null;
  cancellation_reason?: string | null;
  customer: InvoiceCustomer;
  deliveryInformation: InvoiceDeliveryInformation;
  orderItems: InvoiceOrderItem[];
  orderPayment?: InvoiceOrderPayment | null;
  subtotal_without_tax: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total_amount: number;
}

export interface InvoiceCompanyInfo {
  company_name: string;
  address_line?: string;
  city_line?: string;
  phone?: string;
  email?: string;
  vat_no?: string;
  pan_no?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatNumber(value: number): string {
  return (value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const datePart = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

function capitalize(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeInvoiceOrder(order: any): any {
  const rawCustomer = order?.customer ?? {};
  const customerInfo = order?.customerInfo ?? {};
  const shippingInfo = order?.shippingInfo ?? {};
  const deliveryInformation = order?.deliveryInformation ?? {};
  const summary = order?.summary ?? {};

  const customerName =
    (typeof rawCustomer === "string" ? rawCustomer : rawCustomer?.full_name) ||
    customerInfo.full_name ||
    customerInfo.name ||
    order?.customerName ||
    order?.customer_name ||
    "Customer";

  const customerEmail =
    (typeof rawCustomer === "object" && rawCustomer?.email) ||
    customerInfo.email ||
    order?.invoice_email ||
    order?.billing_email ||
    "";

  const customerPhone =
    (typeof rawCustomer === "object" && rawCustomer?.phone) ||
    customerInfo.phone ||
    order?.customerPhone ||
    "";

  const customerCreatedAt =
    (typeof rawCustomer === "object" && rawCustomer?.created_at) ||
    customerInfo.created_at ||
    order?.customer_created_at ||
    order?.created_at ||
    new Date();

  const zoneName =
    deliveryInformation.zone?.zone_name ||
    shippingInfo.zone ||
    shippingInfo.zone_name ||
    "";
  const cityName =
    deliveryInformation.city?.city ||
    shippingInfo.city ||
    shippingInfo.city_name ||
    "";
  const provinceName =
    deliveryInformation.province?.province_name ||
    shippingInfo.province ||
    shippingInfo.province_name ||
    "";

  const addressLine =
    deliveryInformation.address ||
    shippingInfo.streetAddress ||
    shippingInfo.address ||
    "";

  const rawItems = Array.isArray(order?.orderItems)
    ? order.orderItems
    : Array.isArray(order?.items)
      ? order.items
      : [];

  const orderItems = rawItems.map((item: any) => {
    const productValue = item?.product ?? {};
    const productName =
      (typeof productValue === "string" ? productValue : productValue?.product_name) ||
      item?.product_name ||
      item?.name ||
      item?.title ||
      "Product";
    const sku =
      (typeof productValue === "object" && productValue?.sku) ||
      item?.sku ||
      item?.product_code ||
      null;
    const quantity = Number(item?.quantity ?? item?.qty ?? 0);
    const actualPrice = Number(item?.actual_price ?? item?.unitPrice ?? item?.price ?? 0);
    const subtotalWithoutTax = Number(
      item?.subtotal_without_tax ??
        item?.subtotal ??
        Number((quantity * actualPrice).toFixed(2)),
    );

    return {
      ...item,
      product: {
        product_name: productName,
        sku,
      },
      quantity,
      actual_price: actualPrice,
      subtotal_without_tax: subtotalWithoutTax,
    };
  });

  const subtotalWithoutTax = Number(
    order?.subtotal_without_tax ??
      summary.subtotal ??
      summary.subtotalWithoutTax ??
      rawItems.reduce((sum: number, item: any) => sum + Number(item?.subtotal_without_tax ?? item?.subtotal ?? 0), 0),
  );
  const tax = Number(order?.tax ?? summary.tax ?? 0);
  const shippingCost = Number(order?.shipping_cost ?? summary.shippingCost ?? summary.shipping ?? 0);
  const discount = Number(order?.discount ?? summary.discount ?? 0);
  const totalAmount = Number(order?.total_amount ?? summary.totalAmount ?? summary.grandTotal ?? 0);
  const orderStatus = String(order?.order_status ?? order?.orderStatus ?? "processing").toLowerCase();
  const paymentStatus = String(order?.payment_status ?? order?.paymentStatus ?? "unpaid").toLowerCase();

  const dueAmount = Number(
    order?.orderPayment?.due_amount ??
      order?.due_amount ??
      (paymentStatus === "unpaid" ? totalAmount : 0),
  );

  return {
    ...order,
    order_id: order?.order_id ?? order?.orderId ?? "",
    created_at: order?.created_at ?? new Date(),
    order_status: orderStatus,
    payment_status: paymentStatus,
    total_items: Number(order?.total_items ?? orderItems.length ?? 0),
    customer: {
      full_name: customerName,
      email: customerEmail,
      phone: customerPhone,
      created_at: customerCreatedAt,
    },
    deliveryInformation: {
      address: addressLine,
      zone: { zone_name: zoneName },
      city: { city: cityName },
      province: { province_name: provinceName },
    },
    orderItems,
    orderPayment: {
      due_amount: dueAmount,
    },
    subtotal_without_tax: subtotalWithoutTax,
    tax,
    shipping_cost: shippingCost,
    discount,
    total_amount: totalAmount,
    delivered_at: order?.delivered_at ?? null,
    cancellation_reason: order?.cancellation_reason ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Main HTML builder (unchanged — this is the reference design)       */
/* Main HTML builder (unchanged — this is the reference design)       */
/* ------------------------------------------------------------------ */

export function buildInvoicePdfHtml(order: InvoiceOrder, company: InvoiceCompanyInfo): string {
  order = normalizeInvoiceOrder(order) as InvoiceOrder;
  const now = new Date();

  const companyName = escapeHtml(company.company_name);
  const addressLine = escapeHtml(company.address_line ?? "123 Dental Plaza, Medical District");
  const addressLine = escapeHtml(company.address_line ?? "123 Dental Plaza, Medical District");
  const cityLine = escapeHtml(company.city_line ?? "Kathmandu, Nepal 44600");
  const phone = escapeHtml(company.phone ?? "+977-1-1234567");
  const email = escapeHtml(company.email ?? "info@gargdental.com");
  const vatNo = escapeHtml(company.vat_no ?? "123456789");
  const panNo = escapeHtml(company.pan_no ?? "987654321");

  const dueAmount = order.orderPayment?.due_amount ?? 0;
  const hasDue = dueAmount > 0;
  const amountPaid = order.total_amount - dueAmount;

  const itemsRows = order.orderItems
    .map((item, index) => {
      const skuRow = item.product.sku ? `<div class="product-sku">SKU: ${escapeHtml(item.product.sku)}</div>` : "";
      const skuRow = item.product.sku ? `<div class="product-sku">SKU: ${escapeHtml(item.product.sku)}</div>` : "";
      return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <div class="product-name">${escapeHtml(item.product.product_name)}</div>
                            <div class="product-name">${escapeHtml(item.product.product_name)}</div>
                            ${skuRow}
                        </td>
                        <td class="text-center">${escapeHtml(item.quantity)}</td>
                        <td class="text-right">Rs. ${formatNumber(item.actual_price)}</td>
                        <td class="text-right">Rs. ${formatNumber(item.subtotal_without_tax)}</td>
                        <td class="text-right">Rs. ${formatNumber(item.actual_price)}</td>
                        <td class="text-right">Rs. ${formatNumber(item.subtotal_without_tax)}</td>
                    </tr>`;
    })
    .join("");

  const cancelledBlock =
    order.order_status === "cancelled" && order.cancellation_reason
      ? `
        <div class="additional-info">
            <strong>&#9888; Order Cancelled</strong><br>
            <strong>Reason:</strong> ${escapeHtml(order.cancellation_reason)}
        </div>`
      : "";

  const deliveryDateRow = order.order_status === "delivered" && order.delivered_at ? `<div class="info-row"><span class="info-label">Delivery:</span><span class="info-value">${formatDateLong(order.delivered_at)}</span></div>` : "";
  const dueBadge = hasDue ? `<span class="status-badge due">Due Remaining</span>` : "";
  const discountRow = order.discount > 0 ? `<tr><td class="label">Discount:</td><td class="amount">- Rs. ${formatNumber(order.discount)}</td></tr>` : "";
  const deliveryDateRow = order.order_status === "delivered" && order.delivered_at ? `<div class="info-row"><span class="info-label">Delivery:</span><span class="info-value">${formatDateLong(order.delivered_at)}</span></div>` : "";
  const dueBadge = hasDue ? `<span class="status-badge due">Due Remaining</span>` : "";
  const discountRow = order.discount > 0 ? `<tr><td class="label">Discount:</td><td class="amount">- Rs. ${formatNumber(order.discount)}</td></tr>` : "";

  const paymentInfoBlock = hasDue
    ? `
        <div class="additional-info">
            <strong>&#128176; Payment Information</strong><br>
            <strong>Amount Paid:</strong> Rs. ${formatNumber(amountPaid)}<br>
            <strong>Due Amount:</strong> Rs. ${formatNumber(dueAmount)}
        </div>`
    : "";

  const unpaidNote = order.payment_status === "unpaid" ? `<p><strong>Note:</strong> Please ensure payment is made within the specified terms. Late payments may incur additional charges.</p>` : "";
  const unpaidNote = order.payment_status === "unpaid" ? `<p><strong>Note:</strong> Please ensure payment is made within the specified terms. Late payments may incur additional charges.</p>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${companyName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.5; color: #000; background-color: #fff; font-size: 14px; }
        .container { width: 100%; max-width: 800px; margin: auto; background: white; }
        .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; width: 100%; }
        .header td { vertical-align: top; }
        .company-info h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
        .company-info p { font-size: 12px; color: #333; margin-bottom: 3px; }
        .invoice-title h2 { font-size: 28px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; text-align: right; }
        .invoice-number { font-size: 16px; font-weight: bold; margin-bottom: 5px; text-align: right; }
        .invoice-date { font-size: 12px; color: #666; text-align: right; }
        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .info-table td { vertical-align: top; padding: 0 10px; width: 50%; }
        .info-box h3 { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 15px; letter-spacing: 0.5px; }
        .info-row { margin-bottom: 8px; }
        .info-label { font-weight: bold; display: inline-block; width: 100px; color: #333; }
        .info-value { display: inline-block; }
        .status-badge { display: inline-block; padding: 4px 10px; border: 1px solid #000; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.5; color: #000; background-color: #fff; font-size: 14px; }
        .container { width: 100%; max-width: 800px; margin: auto; background: white; }
        .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; width: 100%; }
        .header td { vertical-align: top; }
        .company-info h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
        .company-info p { font-size: 12px; color: #333; margin-bottom: 3px; }
        .invoice-title h2 { font-size: 28px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; text-align: right; }
        .invoice-number { font-size: 16px; font-weight: bold; margin-bottom: 5px; text-align: right; }
        .invoice-date { font-size: 12px; color: #666; text-align: right; }
        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .info-table td { vertical-align: top; padding: 0 10px; width: 50%; }
        .info-box h3 { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 15px; letter-spacing: 0.5px; }
        .info-row { margin-bottom: 8px; }
        .info-label { font-weight: bold; display: inline-block; width: 100px; color: #333; }
        .info-value { display: inline-block; }
        .status-badge { display: inline-block; padding: 4px 10px; border: 1px solid #000; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-badge.processing { background-color: #fff; color: #000; }
        .status-badge.shipped { background-color: #f0f0f0; color: #000; }
        .status-badge.delivered { background-color: #e0e0e0; color: #000; }
        .status-badge.cancelled { background-color: #fff; color: #666; border-color: #666; }
        .status-badge.paid { background-color: #000; color: #fff; }
        .status-badge.unpaid { background-color: #fff; color: #000; }
        .status-badge.due { background-color: #f5f5f5; color: #333; }
        .items-section { margin-bottom: 30px; }
        .items-title { font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; letter-spacing: 1px; }
        .items-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
        .items-table th { background-color: #000; color: #fff; padding: 12px 10px; text-align: left; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .items-table td { padding: 10px; border-bottom: 1px solid #ccc; vertical-align: top; }
        .items-title { font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; letter-spacing: 1px; }
        .items-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
        .items-table th { background-color: #000; color: #fff; padding: 12px 10px; text-align: left; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .items-table td { padding: 10px; border-bottom: 1px solid #ccc; vertical-align: top; }
        .items-table tbody tr:last-child td { border-bottom: none; }
        .items-table .text-center { text-align: center; }
        .items-table .text-right { text-align: right; font-weight: bold; }
        .product-name { font-weight: bold; margin-bottom: 3px; }
        .product-sku { font-size: 11px; color: #666; }
        .totals-section { margin-top: 20px; border-top: 1px solid #000; padding-top: 15px; }
        .totals-table { width: 300px; margin-left: auto; border-collapse: collapse; }
        .totals-table td { padding: 8px 15px; border-bottom: 1px solid #ddd; }
        .totals-table { width: 300px; margin-left: auto; border-collapse: collapse; }
        .totals-table td { padding: 8px 15px; border-bottom: 1px solid #ddd; }
        .totals-table .label { font-weight: bold; text-align: right; color: #333; }
        .totals-table .amount { text-align: right; font-weight: bold; width: 120px; }
        .grand-total { border-top: 2px solid #000; border-bottom: 2px solid #000; background-color: #f5f5f5; }
        .grand-total td { padding: 12px 15px; font-size: 16px; font-weight: bold; }
        .additional-info { margin: 20px 0; padding: 15px; border-left: 3px solid #000; background-color: #f9f9f9; }
        .footer { margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; color: #666; }
        .additional-info { margin: 20px 0; padding: 15px; border-left: 3px solid #000; background-color: #f9f9f9; }
        .footer { margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <table class="header" width="100%">
            <tr>
                <td width="60%">
                    <div class="company-info">
                        <h1>${companyName}</h1>
                        <p>${addressLine}</p>
                        <p>${cityLine}</p>
                        <p>Phone: ${phone} | Email: ${email}</p>
                        <p>VAT No: ${vatNo} | PAN: ${panNo}</p>
                    </div>
                </td>
                <td width="40%" align="right">
                    <div class="invoice-title">
                        <h2>Invoice</h2>
                        <div class="invoice-number">#${escapeHtml(order.order_id)}</div>
                        <div class="invoice-date">Date: ${formatDateLong(now)}</div>
                        <div class="invoice-date">Generated: ${formatDateTime(now)}</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Customer and Order Info -->
        <table class="info-table">
            <tr>
                <td>
                    <div class="info-box">
                        <h3>Bill To</h3>
                        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${escapeHtml(order.customer.full_name)}</span></div>
                        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${escapeHtml(order.customer.email)}</span></div>
                        <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${escapeHtml(order.customer.phone)}</span></div>
                        <div class="info-row"><span class="info-label">Customer Since:</span><span class="info-value">${formatDateShort(order.customer.created_at)}</span></div>
                        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${escapeHtml(order.customer.full_name)}</span></div>
                        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${escapeHtml(order.customer.email)}</span></div>
                        <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${escapeHtml(order.customer.phone)}</span></div>
                        <div class="info-row"><span class="info-label">Customer Since:</span><span class="info-value">${formatDateShort(order.customer.created_at)}</span></div>
                        <div class="info-row"><span class="info-label">Address:</span>
                            <span class="info-value">
                                ${escapeHtml(order.deliveryInformation.address)}<br>
                                ${escapeHtml(order.deliveryInformation.zone.zone_name)}, ${escapeHtml(order.deliveryInformation.city.city)}<br>
                                ${escapeHtml(order.deliveryInformation.province.province_name)}
                                ${escapeHtml(order.deliveryInformation.zone.zone_name)}, ${escapeHtml(order.deliveryInformation.city.city)}<br>
                                ${escapeHtml(order.deliveryInformation.province.province_name)}
                            </span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="info-box">
                        <h3>Order Details</h3>
                        <div class="info-row"><span class="info-label">Order ID:</span><span class="info-value">${escapeHtml(order.order_id)}</span></div>
                        <div class="info-row"><span class="info-label">Order Date:</span><span class="info-value">${formatDateLong(order.created_at)}</span></div>
                        <div class="info-row"><span class="info-label">Status:</span><span class="info-value"><span class="status-badge ${order.order_status}">${capitalize(order.order_status)}</span></span></div>
                        <div class="info-row"><span class="info-label">Order ID:</span><span class="info-value">${escapeHtml(order.order_id)}</span></div>
                        <div class="info-row"><span class="info-label">Order Date:</span><span class="info-value">${formatDateLong(order.created_at)}</span></div>
                        <div class="info-row"><span class="info-label">Status:</span><span class="info-value"><span class="status-badge ${order.order_status}">${capitalize(order.order_status)}</span></span></div>
                        <div class="info-row"><span class="info-label">Payment:</span>
                            <span class="info-value">
                                <span class="status-badge ${order.payment_status}">${capitalize(order.payment_status)}</span>
                                <span class="status-badge ${order.payment_status}">${capitalize(order.payment_status)}</span>
                                ${dueBadge}
                            </span>
                        </div>
                        <div class="info-row"><span class="info-label">Total Items:</span><span class="info-value">${escapeHtml(order.total_items)}</span></div>
                        <div class="info-row"><span class="info-label">Total Items:</span><span class="info-value">${escapeHtml(order.total_items)}</span></div>
                        ${deliveryDateRow}
                    </div>
                </td>
            </tr>
        </table>

        ${cancelledBlock}

        <!-- Items Table -->
        <div class="items-section">
            <div class="items-title">Items Ordered</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th width="8%">No.</th>
                        <th width="50%">Product Description</th>
                        <th width="10%" class="text-center">Qty</th>
                        <th width="16%" class="text-right">Unit Price</th>
                        <th width="16%" class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>${itemsRows}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr><td class="label">Subtotal:</td><td class="amount">Rs. ${formatNumber(order.subtotal_without_tax)}</td></tr>
                <tr><td class="label">Tax (13%):</td><td class="amount">Rs. ${formatNumber(order.tax)}</td></tr>
                <tr><td class="label">Shipping:</td><td class="amount">Rs. ${formatNumber(order.shipping_cost)}</td></tr>
                <tr><td class="label">Subtotal:</td><td class="amount">Rs. ${formatNumber(order.subtotal_without_tax)}</td></tr>
                <tr><td class="label">Tax (13%):</td><td class="amount">Rs. ${formatNumber(order.tax)}</td></tr>
                <tr><td class="label">Shipping:</td><td class="amount">Rs. ${formatNumber(order.shipping_cost)}</td></tr>
                ${discountRow}
                <tr class="grand-total"><td class="label">TOTAL AMOUNT:</td><td class="amount">Rs. ${formatNumber(order.total_amount)}</td></tr>
                <tr class="grand-total"><td class="label">TOTAL AMOUNT:</td><td class="amount">Rs. ${formatNumber(order.total_amount)}</td></tr>
            </table>
        </div>

        ${paymentInfoBlock}

        <!-- Footer -->
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>For any queries regarding this invoice, please contact us at ${email} or call ${phone}</p>
            <p>Payment Terms: Net 30 days | All prices are in Nepalese Rupees (NPR)</p>
            ${unpaidNote}
        </div>
    </div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* PDF builder — low-level, mirrors the HTML/CSS design 1:1           */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* PDF builder — low-level, mirrors the HTML/CSS design 1:1           */
/* ------------------------------------------------------------------ */

const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const PDF_MARGIN = 42;
const PDF_CONTENT_RIGHT = PDF_PAGE_WIDTH - PDF_MARGIN;
const PDF_CONTENT_WIDTH = PDF_CONTENT_RIGHT - PDF_MARGIN;

type RGB = [number, number, number];

const COLOR_BLACK: RGB = [0, 0, 0];
const COLOR_WHITE: RGB = [1, 1, 1];
const COLOR_GRAY_333: RGB = [0.2, 0.2, 0.2];
const COLOR_GRAY_666: RGB = [0.4, 0.4, 0.4];
const COLOR_GRAY_CCC: RGB = [0.8, 0.8, 0.8];
const COLOR_GRAY_DDD: RGB = [0.87, 0.87, 0.87];
const COLOR_BG_F0: RGB = [0.94, 0.94, 0.94];
const COLOR_BG_F5: RGB = [0.96, 0.96, 0.96];
const COLOR_BG_F9: RGB = [0.976, 0.976, 0.976];
const COLOR_BG_E0: RGB = [0.878, 0.878, 0.878];

function statusBadgeColors(status: string): { fill: RGB; text: RGB; border: RGB } {
  switch (status) {
    case "shipped":
      return { fill: COLOR_BG_F0, text: COLOR_BLACK, border: COLOR_BLACK };
    case "delivered":
      return { fill: COLOR_BG_E0, text: COLOR_BLACK, border: COLOR_BLACK };
    case "cancelled":
      return { fill: COLOR_WHITE, text: COLOR_GRAY_666, border: COLOR_GRAY_666 };
    case "paid":
      return { fill: COLOR_BLACK, text: COLOR_WHITE, border: COLOR_BLACK };
    case "unpaid":
      return { fill: COLOR_WHITE, text: COLOR_BLACK, border: COLOR_BLACK };
    case "due":
      return { fill: COLOR_BG_F5, text: COLOR_GRAY_333, border: COLOR_BLACK };
    case "processing":
    default:
      return { fill: COLOR_WHITE, text: COLOR_BLACK, border: COLOR_BLACK };
  }
}
const PDF_CONTENT_RIGHT = PDF_PAGE_WIDTH - PDF_MARGIN;
const PDF_CONTENT_WIDTH = PDF_CONTENT_RIGHT - PDF_MARGIN;

type RGB = [number, number, number];

const COLOR_BLACK: RGB = [0, 0, 0];
const COLOR_WHITE: RGB = [1, 1, 1];
const COLOR_GRAY_333: RGB = [0.2, 0.2, 0.2];
const COLOR_GRAY_666: RGB = [0.4, 0.4, 0.4];
const COLOR_GRAY_CCC: RGB = [0.8, 0.8, 0.8];
const COLOR_GRAY_DDD: RGB = [0.87, 0.87, 0.87];
const COLOR_BG_F0: RGB = [0.94, 0.94, 0.94];
const COLOR_BG_F5: RGB = [0.96, 0.96, 0.96];
const COLOR_BG_F9: RGB = [0.976, 0.976, 0.976];
const COLOR_BG_E0: RGB = [0.878, 0.878, 0.878];

function statusBadgeColors(status: string): { fill: RGB; text: RGB; border: RGB } {
  switch (status) {
    case "shipped":
      return { fill: COLOR_BG_F0, text: COLOR_BLACK, border: COLOR_BLACK };
    case "delivered":
      return { fill: COLOR_BG_E0, text: COLOR_BLACK, border: COLOR_BLACK };
    case "cancelled":
      return { fill: COLOR_WHITE, text: COLOR_GRAY_666, border: COLOR_GRAY_666 };
    case "paid":
      return { fill: COLOR_BLACK, text: COLOR_WHITE, border: COLOR_BLACK };
    case "unpaid":
      return { fill: COLOR_WHITE, text: COLOR_BLACK, border: COLOR_BLACK };
    case "due":
      return { fill: COLOR_BG_F5, text: COLOR_GRAY_333, border: COLOR_BLACK };
    case "processing":
    default:
      return { fill: COLOR_WHITE, text: COLOR_BLACK, border: COLOR_BLACK };
  }
}

function sanitizePdfText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(text: string, maxChars = 88): string[] {
  const cleaned = String(text || "").trim();
  if (!cleaned) return [""];

  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  const flush = () => {
    if (current) lines.push(current);
    current = "";
  };

  for (const word of words) {
    if (!current) {
      if (word.length <= maxChars) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += maxChars) {
          lines.push(word.slice(i, i + maxChars));
        }
      }
      continue;
    }

    if ((current + " " + word).length <= maxChars) {
      current += ` ${word}`;
    } else if (word.length <= maxChars) {
      flush();
      current = word;
    } else {
      flush();
      for (let i = 0; i < word.length; i += maxChars) {
        const chunk = word.slice(i, i + maxChars);
        if (chunk.length === maxChars) {
          lines.push(chunk);
        } else {
          current = chunk;
        }
      }
    }
  }

  flush();
  return lines.length ? lines : [""];
}

function textWidth(text: string, size: number, bold = false): number {
  return text.length * size * (bold ? 0.56 : 0.5);
}

/**
 * Low-level page canvas. Coordinates are PDF user-space (origin bottom-left).
 * Provides the primitives (filled rects, strokes, text) needed to reproduce
 * the header bars, bordered tables, shaded rows and status "badges" that
 * exist in the HTML/CSS version of this invoice.
 */
class PdfPage {
  private ops: string[] = [];
  private lastFillColor: RGB | null = null;
  private lastStrokeColor: RGB | null = null;
  private lastLineWidth: number | null = null;

  private setFill(color: RGB) {
    if (this.lastFillColor && this.lastFillColor[0] === color[0] && this.lastFillColor[1] === color[1] && this.lastFillColor[2] === color[2]) return;
    this.lastFillColor = color;
    this.ops.push(`${color[0]} ${color[1]} ${color[2]} rg`);
  }

  private setStroke(color: RGB) {
    if (this.lastStrokeColor && this.lastStrokeColor[0] === color[0] && this.lastStrokeColor[1] === color[1] && this.lastStrokeColor[2] === color[2]) return;
    this.lastStrokeColor = color;
    this.ops.push(`${color[0]} ${color[1]} ${color[2]} RG`);
function textWidth(text: string, size: number, bold = false): number {
  return text.length * size * (bold ? 0.56 : 0.5);
}

/**
 * Low-level page canvas. Coordinates are PDF user-space (origin bottom-left).
 * Provides the primitives (filled rects, strokes, text) needed to reproduce
 * the header bars, bordered tables, shaded rows and status "badges" that
 * exist in the HTML/CSS version of this invoice.
 */
class PdfPage {
  private ops: string[] = [];
  private lastFillColor: RGB | null = null;
  private lastStrokeColor: RGB | null = null;
  private lastLineWidth: number | null = null;

  private setFill(color: RGB) {
    if (this.lastFillColor && this.lastFillColor[0] === color[0] && this.lastFillColor[1] === color[1] && this.lastFillColor[2] === color[2]) return;
    this.lastFillColor = color;
    this.ops.push(`${color[0]} ${color[1]} ${color[2]} rg`);
  }

  private setStroke(color: RGB) {
    if (this.lastStrokeColor && this.lastStrokeColor[0] === color[0] && this.lastStrokeColor[1] === color[1] && this.lastStrokeColor[2] === color[2]) return;
    this.lastStrokeColor = color;
    this.ops.push(`${color[0]} ${color[1]} ${color[2]} RG`);
  }

  private setLineWidth(w: number) {
    if (this.lastLineWidth === w) return;
    this.lastLineWidth = w;
    this.ops.push(`${w} w`);
  }

  /** Filled rectangle. y is the BOTTOM of the rectangle (PDF convention). */
  fillRect(x: number, y: number, w: number, h: number, color: RGB) {
    this.setFill(color);
    this.ops.push(`${x} ${y} ${w} ${h} re f`);
  }

  /** Stroked (outline) rectangle. */
  strokeRect(x: number, y: number, w: number, h: number, color: RGB = COLOR_BLACK, lineWidth = 1) {
    this.setStroke(color);
    this.setLineWidth(lineWidth);
    this.ops.push(`${x} ${y} ${w} ${h} re S`);
  }

  /** Straight line. */
  line(x1: number, y1: number, x2: number, y2: number, color: RGB = COLOR_BLACK, lineWidth = 1) {
    this.setStroke(color);
    this.setLineWidth(lineWidth);
    this.ops.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  }

  /** Baseline text. y is the text baseline. */
  text(x: number, y: number, value: string, opts: { size?: number; bold?: boolean; color?: RGB; align?: "left" | "right" | "center" } = {}) {
    const size = opts.size ?? 10;
    const bold = opts.bold ?? false;
    const color = opts.color ?? COLOR_BLACK;
    const safe = sanitizePdfText(value);
    let drawX = x;
    if (opts.align === "right") drawX = x - textWidth(value, size, bold);
    else if (opts.align === "center") drawX = x - textWidth(value, size, bold) / 2;

    this.setFill(color);
    const font = bold ? "/F2" : "/F1";
    this.ops.push(`BT ${font} ${size} Tf 1 0 0 1 ${drawX} ${y} Tm (${safe}) Tj ET`);
  }

  /** A small bordered "badge" — mirrors .status-badge in the CSS. */
  badge(x: number, y: number, label: string, colors: { fill: RGB; text: RGB; border: RGB }): number {
    const size = 8;
    const paddingX = 7;
    const height = 14;
    const w = textWidth(label, size, true) + paddingX * 2;
    const bottom = y - 10;
    this.fillRect(x, bottom, w, height, colors.fill);
    this.strokeRect(x, bottom, w, height, colors.border, 1);
    this.text(x + paddingX, y - 4, label, { size, bold: true, color: colors.text });
    return w;
  }

  toContentStream(): string {
    return this.ops.join("\n");
  }
}

interface PageBudget {
  page: PdfPage;
  y: number; // cursor, current top-of-next-element y
}

function newPage(pages: PdfPage[]): PageBudget {
  const page = new PdfPage();
  pages.push(page);
  return { page, y: PDF_PAGE_HEIGHT - PDF_MARGIN };
}

function ensureSpace(budget: PageBudget, pages: PdfPage[], needed: number): PageBudget {
  if (budget.y - needed < PDF_MARGIN) {
    return newPage(pages);
  }
  return budget;
}

/* ---- Section renderers ---------------------------------------------- */

function drawHeader(b: PageBudget, order: any, company: InvoiceCompanyInfo) {
  const now = new Date();
  const companyName = (company.company_name || "Garg Dental").toUpperCase();
  const addressLine = company.address_line ?? "123 Dental Plaza, Medical District";
  const cityLine = company.city_line ?? "Kathmandu, Nepal 44600";
  const phone = company.phone ?? "+977-1-1234567";
  const email = company.email ?? "info@gargdental.com";
  const vatNo = company.vat_no ?? "123456789";
  const panNo = company.pan_no ?? "987654321";
  const orderId = order.order_id ?? order.orderId ?? "";

  let y = b.y;

  // Row 1: company name (h1, 24/bold) vs "INVOICE" (h2, 28/bold, right)
  b.page.text(PDF_MARGIN, y, companyName, { size: 20, bold: true });
  b.page.text(PDF_CONTENT_RIGHT, y, "INVOICE", { size: 24, bold: true, align: "right" });
  y -= 18;

  // Row 2: address vs invoice number
  b.page.text(PDF_MARGIN, y, addressLine, { size: 10, color: COLOR_GRAY_333 });
  b.page.text(PDF_CONTENT_RIGHT, y, `#${orderId}`, { size: 13, bold: true, align: "right" });
  y -= 14;

  // Row 3: city line vs date
  b.page.text(PDF_MARGIN, y, cityLine, { size: 10, color: COLOR_GRAY_333 });
  b.page.text(PDF_CONTENT_RIGHT, y, `Date: ${formatDateLong(now)}`, { size: 9.5, color: COLOR_GRAY_666, align: "right" });
  y -= 14;

  // Row 4: phone/email vs generated timestamp
  b.page.text(PDF_MARGIN, y, `Phone: ${phone} | Email: ${email}`, { size: 10, color: COLOR_GRAY_333 });
  b.page.text(PDF_CONTENT_RIGHT, y, `Generated: ${formatDateTime(now)}`, { size: 9.5, color: COLOR_GRAY_666, align: "right" });
  y -= 14;

  // Row 5: vat/pan
  b.page.text(PDF_MARGIN, y, `VAT No: ${vatNo} | PAN: ${panNo}`, { size: 10, color: COLOR_GRAY_333 });
  y -= 14;

  // border-bottom: 2px solid #000; padding-bottom: 20px
  b.page.line(PDF_MARGIN, y, PDF_CONTENT_RIGHT, y, COLOR_BLACK, 2);
  y -= 24; // margin-bottom: 30px total gap (approx, scaled to fit)

  b.y = y;
}

function drawInfoColumn(page: PdfPage, x: number, width: number, topY: number, title: string, rows: Array<{ label: string; value?: string; badge?: { text: string; status: string }; extraBadge?: { text: string; status: string } }>): number {
  let y = topY;
  page.text(x, y, title, { size: 12.5, bold: true });
  y -= 6;
  page.line(x, y, x + width, y, COLOR_BLACK, 1);
  y -= 16;

  const labelWidth = 82;

  for (const row of rows) {
    if (row.badge) {
      page.text(x, y, row.label, { size: 10, bold: true, color: COLOR_GRAY_333 });
      const colors = statusBadgeColors(row.badge.status);
      const usedWidth = page.badge(x + labelWidth, y, row.badge.text.toUpperCase(), colors);
      if (row.extraBadge) {
        const c2 = statusBadgeColors(row.extraBadge.status);
        page.badge(x + labelWidth + usedWidth + 6, y, row.extraBadge.text.toUpperCase(), c2);
      }
      y -= 18;
      continue;
    }

    page.text(x, y, row.label, { size: 10, bold: true, color: COLOR_GRAY_333 });
    const valueLines = wrapPdfText(row.value ?? "", Math.floor((width - labelWidth) / 4.6));
    valueLines.forEach((line, idx) => {
      page.text(x + labelWidth, y, line, { size: 10 });
      if (idx < valueLines.length - 1) y -= 12;
    });
    y -= 14;
  }

  return y;
}

function drawInfoSection(b: PageBudget, pages: PdfPage[], order: any): PageBudget {
  const columnGap = 20;
  const columnWidth = (PDF_CONTENT_WIDTH - columnGap) / 2;
  const leftX = PDF_MARGIN;
  const rightX = PDF_MARGIN + columnWidth + columnGap;

  b = ensureSpace(b, pages, 160);

  const customer = order.customer ?? {};
  const delivery = order.deliveryInformation ?? {};
  const addressValue = [delivery.address, [delivery.zone?.zone_name, delivery.city?.city].filter(Boolean).join(", "), delivery.province?.province_name].filter(Boolean).join(", ");

  const leftRows = [
    { label: "Name:", value: customer.full_name ?? "" },
    { label: "Email:", value: customer.email ?? "" },
    { label: "Phone:", value: customer.phone ?? "" },
    { label: "Customer Since:", value: customer.created_at ? formatDateShort(customer.created_at) : "-" },
    { label: "Address:", value: addressValue },
  ];

  private setLineWidth(w: number) {
    if (this.lastLineWidth === w) return;
    this.lastLineWidth = w;
    this.ops.push(`${w} w`);
  }

  /** Filled rectangle. y is the BOTTOM of the rectangle (PDF convention). */
  fillRect(x: number, y: number, w: number, h: number, color: RGB) {
    this.setFill(color);
    this.ops.push(`${x} ${y} ${w} ${h} re f`);
  }

  /** Stroked (outline) rectangle. */
  strokeRect(x: number, y: number, w: number, h: number, color: RGB = COLOR_BLACK, lineWidth = 1) {
    this.setStroke(color);
    this.setLineWidth(lineWidth);
    this.ops.push(`${x} ${y} ${w} ${h} re S`);
  }

  /** Straight line. */
  line(x1: number, y1: number, x2: number, y2: number, color: RGB = COLOR_BLACK, lineWidth = 1) {
    this.setStroke(color);
    this.setLineWidth(lineWidth);
    this.ops.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  }

  /** Baseline text. y is the text baseline. */
  text(x: number, y: number, value: string, opts: { size?: number; bold?: boolean; color?: RGB; align?: "left" | "right" | "center" } = {}) {
    const size = opts.size ?? 10;
    const bold = opts.bold ?? false;
    const color = opts.color ?? COLOR_BLACK;
    const safe = sanitizePdfText(value);
    let drawX = x;
    if (opts.align === "right") drawX = x - textWidth(value, size, bold);
    else if (opts.align === "center") drawX = x - textWidth(value, size, bold) / 2;

    this.setFill(color);
    const font = bold ? "/F2" : "/F1";
    this.ops.push(`BT ${font} ${size} Tf 1 0 0 1 ${drawX} ${y} Tm (${safe}) Tj ET`);
  }

  /** A small bordered "badge" — mirrors .status-badge in the CSS. */
  badge(x: number, y: number, label: string, colors: { fill: RGB; text: RGB; border: RGB }): number {
    const size = 8;
    const paddingX = 7;
    const height = 14;
    const w = textWidth(label, size, true) + paddingX * 2;
    const bottom = y - 10;
    this.fillRect(x, bottom, w, height, colors.fill);
    this.strokeRect(x, bottom, w, height, colors.border, 1);
    this.text(x + paddingX, y - 4, label, { size, bold: true, color: colors.text });
    return w;
  }

  toContentStream(): string {
    return this.ops.join("\n");
  }
}

interface PageBudget {
  page: PdfPage;
  y: number; // cursor, current top-of-next-element y
}

function newPage(pages: PdfPage[]): PageBudget {
  const page = new PdfPage();
  pages.push(page);
  return { page, y: PDF_PAGE_HEIGHT - PDF_MARGIN };
}

function ensureSpace(budget: PageBudget, pages: PdfPage[], needed: number): PageBudget {
  if (budget.y - needed < PDF_MARGIN) {
    return newPage(pages);
  }
  return budget;
}

/* ---- Section renderers ---------------------------------------------- */

function drawHeader(b: PageBudget, order: any, company: InvoiceCompanyInfo) {
  const now = new Date();
  const companyName = (company.company_name || "Garg Dental").toUpperCase();
  const addressLine = company.address_line ?? "123 Dental Plaza, Medical District";
  const cityLine = company.city_line ?? "Kathmandu, Nepal 44600";
  const phone = company.phone ?? "+977-1-1234567";
  const email = company.email ?? "info@gargdental.com";
  const vatNo = company.vat_no ?? "123456789";
  const panNo = company.pan_no ?? "987654321";
  const orderId = order.order_id ?? order.orderId ?? "";

  let y = b.y;

  // Row 1: company name (h1, 24/bold) vs "INVOICE" (h2, 28/bold, right)
  b.page.text(PDF_MARGIN, y, companyName, { size: 20, bold: true });
  b.page.text(PDF_CONTENT_RIGHT, y, "INVOICE", { size: 24, bold: true, align: "right" });
  y -= 18;

  // Row 2: address vs invoice number
  b.page.text(PDF_MARGIN, y, addressLine, { size: 10, color: COLOR_GRAY_333 });
  b.page.text(PDF_CONTENT_RIGHT, y, `#${orderId}`, { size: 13, bold: true, align: "right" });
  y -= 14;

  // Row 3: city line vs date
  b.page.text(PDF_MARGIN, y, cityLine, { size: 10, color: COLOR_GRAY_333 });
  b.page.text(PDF_CONTENT_RIGHT, y, `Date: ${formatDateLong(now)}`, { size: 9.5, color: COLOR_GRAY_666, align: "right" });
  y -= 14;

  // Row 4: phone/email vs generated timestamp
  b.page.text(PDF_MARGIN, y, `Phone: ${phone} | Email: ${email}`, { size: 10, color: COLOR_GRAY_333 });
  b.page.text(PDF_CONTENT_RIGHT, y, `Generated: ${formatDateTime(now)}`, { size: 9.5, color: COLOR_GRAY_666, align: "right" });
  y -= 14;

  // Row 5: vat/pan
  b.page.text(PDF_MARGIN, y, `VAT No: ${vatNo} | PAN: ${panNo}`, { size: 10, color: COLOR_GRAY_333 });
  y -= 14;

  // border-bottom: 2px solid #000; padding-bottom: 20px
  b.page.line(PDF_MARGIN, y, PDF_CONTENT_RIGHT, y, COLOR_BLACK, 2);
  y -= 24; // margin-bottom: 30px total gap (approx, scaled to fit)

  b.y = y;
}

function drawInfoColumn(page: PdfPage, x: number, width: number, topY: number, title: string, rows: Array<{ label: string; value?: string; badge?: { text: string; status: string }; extraBadge?: { text: string; status: string } }>): number {
  let y = topY;
  page.text(x, y, title, { size: 12.5, bold: true });
  y -= 6;
  page.line(x, y, x + width, y, COLOR_BLACK, 1);
  y -= 16;

  const labelWidth = 82;

  for (const row of rows) {
    if (row.badge) {
      page.text(x, y, row.label, { size: 10, bold: true, color: COLOR_GRAY_333 });
      const colors = statusBadgeColors(row.badge.status);
      const usedWidth = page.badge(x + labelWidth, y, row.badge.text.toUpperCase(), colors);
      if (row.extraBadge) {
        const c2 = statusBadgeColors(row.extraBadge.status);
        page.badge(x + labelWidth + usedWidth + 6, y, row.extraBadge.text.toUpperCase(), c2);
      }
      y -= 18;
      continue;
    }

    page.text(x, y, row.label, { size: 10, bold: true, color: COLOR_GRAY_333 });
    const valueLines = wrapPdfText(row.value ?? "", Math.floor((width - labelWidth) / 4.6));
    valueLines.forEach((line, idx) => {
      page.text(x + labelWidth, y, line, { size: 10 });
      if (idx < valueLines.length - 1) y -= 12;
    });
    y -= 14;
  }

  return y;
}

function drawInfoSection(b: PageBudget, pages: PdfPage[], order: any): PageBudget {
  const columnGap = 20;
  const columnWidth = (PDF_CONTENT_WIDTH - columnGap) / 2;
  const leftX = PDF_MARGIN;
  const rightX = PDF_MARGIN + columnWidth + columnGap;

  b = ensureSpace(b, pages, 160);

  const customer = order.customer ?? {};
  const delivery = order.deliveryInformation ?? {};
  const addressValue = [delivery.address, [delivery.zone?.zone_name, delivery.city?.city].filter(Boolean).join(", "), delivery.province?.province_name].filter(Boolean).join(", ");

  const leftRows = [
    { label: "Name:", value: customer.full_name ?? "" },
    { label: "Email:", value: customer.email ?? "" },
    { label: "Phone:", value: customer.phone ?? "" },
    { label: "Customer Since:", value: customer.created_at ? formatDateShort(customer.created_at) : "-" },
    { label: "Address:", value: addressValue },
  ];

  const orderStatus = String(order.order_status ?? order.orderStatus ?? "processing");
  const paymentStatus = String(order.payment_status ?? order.paymentStatus ?? "unpaid");
  const dueAmount = order.orderPayment?.due_amount ?? 0;
  const hasDue = dueAmount > 0;

  const rightRows: Array<{ label: string; value?: string; badge?: { text: string; status: string }; extraBadge?: { text: string; status: string } }> = [
    { label: "Order ID:", value: String(order.order_id ?? "") },
    { label: "Order Date:", value: order.created_at ? formatDateLong(order.created_at) : "" },
    { label: "Status:", badge: { text: capitalize(orderStatus), status: orderStatus } },
    {
      label: "Payment:",
      badge: { text: capitalize(paymentStatus), status: paymentStatus },
      extraBadge: hasDue ? { text: "Due Remaining", status: "due" } : undefined,
    },
    { label: "Total Items:", value: String(order.total_items ?? (Array.isArray(order.orderItems) ? order.orderItems.length : 0)) },
  ];

  if (orderStatus === "delivered" && order.delivered_at) {
    rightRows.push({ label: "Delivery:", value: formatDateLong(order.delivered_at) });
  }

  const topY = b.y;
  const leftEndY = drawInfoColumn(b.page, leftX, columnWidth, topY, "BILL TO", leftRows);
  const rightEndY = drawInfoColumn(b.page, rightX, columnWidth, topY, "ORDER DETAILS", rightRows);

  b.y = Math.min(leftEndY, rightEndY) - 8;

  // Cancelled block (.additional-info)
  if (orderStatus === "cancelled" && order.cancellation_reason) {
    const reasonLines = wrapPdfText(`Reason: ${order.cancellation_reason}`, 100);
    const blockHeight = 18 + reasonLines.length * 12 + 10;
    b = ensureSpace(b, pages, blockHeight + 10);
    const top = b.y;
    const bottom = top - blockHeight;
    b.page.fillRect(PDF_MARGIN, bottom, PDF_CONTENT_WIDTH, blockHeight, COLOR_BG_F9);
    b.page.fillRect(PDF_MARGIN, bottom, 3, blockHeight, COLOR_BLACK);
    let ry = top - 12;
    b.page.text(PDF_MARGIN + 10, ry, "\u26A0 Order Cancelled", { size: 10, bold: true });
    ry -= 14;
    reasonLines.forEach((line) => {
      b.page.text(PDF_MARGIN + 10, ry, line, { size: 9.5 });
      ry -= 12;
    });
    b.y = bottom - 12;
  }

  return b;
}

function drawItemsSection(b: PageBudget, pages: PdfPage[], order: any): PageBudget {
  b = ensureSpace(b, pages, 60);

  // "ITEMS ORDERED" title with 2px bottom border
  b.page.text(PDF_MARGIN, b.y, "ITEMS ORDERED", { size: 13, bold: true });
  b.y -= 8;
  b.page.line(PDF_MARGIN, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_BLACK, 2);
  b.y -= 20;

  const colNoX = PDF_MARGIN + 6;
  const colDescX = PDF_MARGIN + 32;
  const colQtyRightX = PDF_MARGIN + 320;
  const colPriceRightX = PDF_MARGIN + 410;
  const colAmountRightX = PDF_CONTENT_RIGHT - 6;
  const tableTop0 = b.y;
  const headerHeight = 22;

  const drawTableTop = () => {
    // outer border top handled per-page via strokeRect at the end; draw header bar now
    const barTop = b.y;
    b.page.fillRect(PDF_MARGIN, barTop - headerHeight, PDF_CONTENT_WIDTH, headerHeight, COLOR_BLACK);
    const textY = barTop - headerHeight / 2 - 3;
    b.page.text(colNoX, textY, "NO.", { size: 9.5, bold: true, color: COLOR_WHITE });
    b.page.text(colDescX, textY, "PRODUCT DESCRIPTION", { size: 9.5, bold: true, color: COLOR_WHITE });
    b.page.text(colQtyRightX, textY, "QTY", { size: 9.5, bold: true, color: COLOR_WHITE, align: "right" });
    b.page.text(colPriceRightX, textY, "UNIT PRICE", { size: 9.5, bold: true, color: COLOR_WHITE, align: "right" });
    b.page.text(colAmountRightX, textY, "AMOUNT", { size: 9.5, bold: true, color: COLOR_WHITE, align: "right" });
    b.y = barTop - headerHeight;
  };

  drawTableTop();
  let tableTop = tableTop0;

  const items = Array.isArray(order.orderItems) ? order.orderItems : Array.isArray(order.items) ? order.items : [];

  const finishBox = (top: number) => {
    b.page.strokeRect(PDF_MARGIN, b.y, PDF_CONTENT_WIDTH, top - b.y, COLOR_BLACK, 2);
  };

  const orderStatus = String(order.order_status ?? order.orderStatus ?? "processing");
  const paymentStatus = String(order.payment_status ?? order.paymentStatus ?? "unpaid");
  const dueAmount = order.orderPayment?.due_amount ?? 0;
  const hasDue = dueAmount > 0;

  const rightRows: Array<{ label: string; value?: string; badge?: { text: string; status: string }; extraBadge?: { text: string; status: string } }> = [
    { label: "Order ID:", value: String(order.order_id ?? "") },
    { label: "Order Date:", value: order.created_at ? formatDateLong(order.created_at) : "" },
    { label: "Status:", badge: { text: capitalize(orderStatus), status: orderStatus } },
    {
      label: "Payment:",
      badge: { text: capitalize(paymentStatus), status: paymentStatus },
      extraBadge: hasDue ? { text: "Due Remaining", status: "due" } : undefined,
    },
    { label: "Total Items:", value: String(order.total_items ?? (Array.isArray(order.orderItems) ? order.orderItems.length : 0)) },
  ];

  if (orderStatus === "delivered" && order.delivered_at) {
    rightRows.push({ label: "Delivery:", value: formatDateLong(order.delivered_at) });
  }

  const topY = b.y;
  const leftEndY = drawInfoColumn(b.page, leftX, columnWidth, topY, "BILL TO", leftRows);
  const rightEndY = drawInfoColumn(b.page, rightX, columnWidth, topY, "ORDER DETAILS", rightRows);

  b.y = Math.min(leftEndY, rightEndY) - 8;

  // Cancelled block (.additional-info)
  if (orderStatus === "cancelled" && order.cancellation_reason) {
    const reasonLines = wrapPdfText(`Reason: ${order.cancellation_reason}`, 100);
    const blockHeight = 18 + reasonLines.length * 12 + 10;
    b = ensureSpace(b, pages, blockHeight + 10);
    const top = b.y;
    const bottom = top - blockHeight;
    b.page.fillRect(PDF_MARGIN, bottom, PDF_CONTENT_WIDTH, blockHeight, COLOR_BG_F9);
    b.page.fillRect(PDF_MARGIN, bottom, 3, blockHeight, COLOR_BLACK);
    let ry = top - 12;
    b.page.text(PDF_MARGIN + 10, ry, "\u26A0 Order Cancelled", { size: 10, bold: true });
    ry -= 14;
    reasonLines.forEach((line) => {
      b.page.text(PDF_MARGIN + 10, ry, line, { size: 9.5 });
      ry -= 12;
    });
    b.y = bottom - 12;
  }

  return b;
}

function drawItemsSection(b: PageBudget, pages: PdfPage[], order: any): PageBudget {
  b = ensureSpace(b, pages, 60);

  // "ITEMS ORDERED" title with 2px bottom border
  b.page.text(PDF_MARGIN, b.y, "ITEMS ORDERED", { size: 13, bold: true });
  b.y -= 8;
  b.page.line(PDF_MARGIN, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_BLACK, 2);
  b.y -= 20;

  const colNoX = PDF_MARGIN + 6;
  const colDescX = PDF_MARGIN + 32;
  const colQtyRightX = PDF_MARGIN + 320;
  const colPriceRightX = PDF_MARGIN + 410;
  const colAmountRightX = PDF_CONTENT_RIGHT - 6;
  const tableTop0 = b.y;
  const headerHeight = 22;

  const drawTableTop = () => {
    // outer border top handled per-page via strokeRect at the end; draw header bar now
    const barTop = b.y;
    b.page.fillRect(PDF_MARGIN, barTop - headerHeight, PDF_CONTENT_WIDTH, headerHeight, COLOR_BLACK);
    const textY = barTop - headerHeight / 2 - 3;
    b.page.text(colNoX, textY, "NO.", { size: 9.5, bold: true, color: COLOR_WHITE });
    b.page.text(colDescX, textY, "PRODUCT DESCRIPTION", { size: 9.5, bold: true, color: COLOR_WHITE });
    b.page.text(colQtyRightX, textY, "QTY", { size: 9.5, bold: true, color: COLOR_WHITE, align: "right" });
    b.page.text(colPriceRightX, textY, "UNIT PRICE", { size: 9.5, bold: true, color: COLOR_WHITE, align: "right" });
    b.page.text(colAmountRightX, textY, "AMOUNT", { size: 9.5, bold: true, color: COLOR_WHITE, align: "right" });
    b.y = barTop - headerHeight;
  };

  drawTableTop();
  let tableTop = tableTop0;

  const items = Array.isArray(order.orderItems) ? order.orderItems : Array.isArray(order.items) ? order.items : [];

  const finishBox = (top: number) => {
    b.page.strokeRect(PDF_MARGIN, b.y, PDF_CONTENT_WIDTH, top - b.y, COLOR_BLACK, 2);
  };

  if (!items.length) {
    const rowH = 26;
    b = ensureSpace(b, pages, rowH);
    b.page.text(colDescX, b.y - 16, "No items found.", { size: 10, color: COLOR_GRAY_666 });
    b.y -= rowH;
    finishBox(tableTop);
    b.y -= 20;
    return b;
  }

  items.forEach((item: any, index: number) => {
    const productName = item.product?.product_name || item.product || item.product_name || "Product";
    const sku = item.product?.sku || item.sku || "";
    const qty = Number(item.quantity || item.qty || 0);
    const unitPrice = Number(item.actual_price || item.unitPrice || item.price || 0);
    const subtotal = Number(item.subtotal_without_tax || item.subtotal || qty * unitPrice);

    const descLines = wrapPdfText(productName, 46);
    const lineCount = descLines.length + (sku ? 1 : 0);
    const rowHeight = 14 + lineCount * 12 + 6;

    if (b.y - rowHeight < PDF_MARGIN) {
      finishBox(tableTop);
      b = newPage(pages);
      drawTableTop();
      tableTop = b.y + headerHeight;
    }

    const rowTop = b.y;
    let ty = rowTop - 15;
    b.page.text(colNoX, ty, String(index + 1), { size: 10 });
    descLines.forEach((line, idx) => {
      b.page.text(colDescX, ty, line, { size: 10, bold: idx === 0 });
      if (idx < descLines.length - 1) ty -= 12;
    });
    b.page.text(colQtyRightX, rowTop - 15, String(qty), { size: 10, align: "right" });
    b.page.text(colPriceRightX, rowTop - 15, `Rs. ${formatNumber(unitPrice)}`, { size: 10, bold: true, align: "right" });
    b.page.text(colAmountRightX, rowTop - 15, `Rs. ${formatNumber(subtotal)}`, { size: 10, bold: true, align: "right" });

    if (sku) {
      ty -= 12;
      b.page.text(colDescX, ty, `SKU: ${sku}`, { size: 8.5, color: COLOR_GRAY_666 });
    }

    b.y = rowTop - rowHeight;
    // row divider (border-bottom: 1px solid #ccc) — skip after very last row, added below anyway by outer box
    b.page.line(PDF_MARGIN, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_GRAY_CCC, 0.75);
  });

  finishBox(tableTop);
  b.y -= 24;
  return b;
}

function drawTotalsSection(b: PageBudget, pages: PdfPage[], order: any): PageBudget {
  const subTotalAmt = Number(order.subtotal_without_tax ?? 0);
  const taxAmt = Number(order.tax ?? 0);
  const shippingAmt = Number(order.shipping_cost ?? 0);
  const discountAmt = Number(order.discount ?? 0);
  const totalAmt = Number(order.total_amount ?? 0);

  const boxWidth = 260;
  const labelX = PDF_CONTENT_RIGHT - boxWidth;
  const amountRightX = PDF_CONTENT_RIGHT;
  const rowHeight = 20;

  const rows: Array<{ label: string; amount: string }> = [
    { label: "Subtotal:", amount: `Rs. ${formatNumber(subTotalAmt)}` },
    { label: "Tax (13%):", amount: `Rs. ${formatNumber(taxAmt)}` },
    { label: "Shipping:", amount: `Rs. ${formatNumber(shippingAmt)}` },
  ];
  if (discountAmt > 0) rows.push({ label: "Discount:", amount: `- Rs. ${formatNumber(discountAmt)}` });

  const needed = rowHeight * rows.length + 34 + 10;
  b = ensureSpace(b, pages, needed);

  // totals-section { border-top: 1px solid #000; padding-top: 15px }
  b.page.line(labelX - 10, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_BLACK, 1);
  b.y -= 18;

  rows.forEach((row) => {
    const rowTop = b.y;
    b.page.text(labelX, rowTop - 6, row.label, { size: 10, bold: true, color: COLOR_GRAY_333 });
    b.page.text(amountRightX, rowTop - 6, row.amount, { size: 10, bold: true, align: "right" });
    b.y -= rowHeight;
    b.page.line(labelX, b.y + 2, PDF_CONTENT_RIGHT, b.y + 2, COLOR_GRAY_DDD, 0.75);
  });

  // grand-total: border-top 2px, border-bottom 2px, bg #f5f5f5
  const gtHeight = 30;
  const gtTop = b.y;
  const gtBottom = gtTop - gtHeight;
  b.page.fillRect(labelX, gtBottom, boxWidth, gtHeight, COLOR_BG_F5);
  b.page.line(labelX, gtTop, PDF_CONTENT_RIGHT, gtTop, COLOR_BLACK, 2);
  b.page.line(labelX, gtBottom, PDF_CONTENT_RIGHT, gtBottom, COLOR_BLACK, 2);
  b.page.text(labelX + 12, gtTop - gtHeight / 2 - 4, "TOTAL AMOUNT:", { size: 12, bold: true });
  b.page.text(amountRightX - 8, gtTop - gtHeight / 2 - 4, `Rs. ${formatNumber(totalAmt)}`, { size: 12, bold: true, align: "right" });
  b.y = gtBottom - 20;

  // Payment info block (.additional-info) when there's a due balance
  const dueAmount = order.orderPayment?.due_amount ?? 0;
  if (dueAmount > 0) {
    const amountPaid = totalAmt - dueAmount;
    const blockHeight = 62;
    b = ensureSpace(b, pages, blockHeight + 10);
    const top = b.y;
    const bottom = top - blockHeight;
    b.page.fillRect(PDF_MARGIN, bottom, PDF_CONTENT_WIDTH, blockHeight, COLOR_BG_F9);
    b.page.fillRect(PDF_MARGIN, bottom, 3, blockHeight, COLOR_BLACK);
    let ry = top - 14;
    b.page.text(PDF_MARGIN + 10, ry, "Payment Information", { size: 10.5, bold: true });
    ry -= 16;
    b.page.text(PDF_MARGIN + 10, ry, `Amount Paid: Rs. ${formatNumber(amountPaid)}`, { size: 9.5 });
    ry -= 14;
    b.page.text(PDF_MARGIN + 10, ry, `Due Amount: Rs. ${formatNumber(dueAmount)}`, { size: 9.5 });
    b.y = bottom - 16;
  }

  return b;
    const rowH = 26;
    b = ensureSpace(b, pages, rowH);
    b.page.text(colDescX, b.y - 16, "No items found.", { size: 10, color: COLOR_GRAY_666 });
    b.y -= rowH;
    finishBox(tableTop);
    b.y -= 20;
    return b;
  }

  items.forEach((item: any, index: number) => {
    const productName = item.product?.product_name || item.product || item.product_name || "Product";
    const sku = item.product?.sku || item.sku || "";
    const qty = Number(item.quantity || item.qty || 0);
    const unitPrice = Number(item.actual_price || item.unitPrice || item.price || 0);
    const subtotal = Number(item.subtotal_without_tax || item.subtotal || qty * unitPrice);

    const descLines = wrapPdfText(productName, 46);
    const lineCount = descLines.length + (sku ? 1 : 0);
    const rowHeight = 14 + lineCount * 12 + 6;

    if (b.y - rowHeight < PDF_MARGIN) {
      finishBox(tableTop);
      b = newPage(pages);
      drawTableTop();
      tableTop = b.y + headerHeight;
    }

    const rowTop = b.y;
    let ty = rowTop - 15;
    b.page.text(colNoX, ty, String(index + 1), { size: 10 });
    descLines.forEach((line, idx) => {
      b.page.text(colDescX, ty, line, { size: 10, bold: idx === 0 });
      if (idx < descLines.length - 1) ty -= 12;
    });
    b.page.text(colQtyRightX, rowTop - 15, String(qty), { size: 10, align: "right" });
    b.page.text(colPriceRightX, rowTop - 15, `Rs. ${formatNumber(unitPrice)}`, { size: 10, bold: true, align: "right" });
    b.page.text(colAmountRightX, rowTop - 15, `Rs. ${formatNumber(subtotal)}`, { size: 10, bold: true, align: "right" });

    if (sku) {
      ty -= 12;
      b.page.text(colDescX, ty, `SKU: ${sku}`, { size: 8.5, color: COLOR_GRAY_666 });
    }

    b.y = rowTop - rowHeight;
    // row divider (border-bottom: 1px solid #ccc) — skip after very last row, added below anyway by outer box
    b.page.line(PDF_MARGIN, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_GRAY_CCC, 0.75);
  });

  finishBox(tableTop);
  b.y -= 24;
  return b;
}

function drawTotalsSection(b: PageBudget, pages: PdfPage[], order: any): PageBudget {
  const subTotalAmt = Number(order.subtotal_without_tax ?? 0);
  const taxAmt = Number(order.tax ?? 0);
  const shippingAmt = Number(order.shipping_cost ?? 0);
  const discountAmt = Number(order.discount ?? 0);
  const totalAmt = Number(order.total_amount ?? 0);

  const boxWidth = 260;
  const labelX = PDF_CONTENT_RIGHT - boxWidth;
  const amountRightX = PDF_CONTENT_RIGHT;
  const rowHeight = 20;

  const rows: Array<{ label: string; amount: string }> = [
    { label: "Subtotal:", amount: `Rs. ${formatNumber(subTotalAmt)}` },
    { label: "Tax (13%):", amount: `Rs. ${formatNumber(taxAmt)}` },
    { label: "Shipping:", amount: `Rs. ${formatNumber(shippingAmt)}` },
  ];
  if (discountAmt > 0) rows.push({ label: "Discount:", amount: `- Rs. ${formatNumber(discountAmt)}` });

  const needed = rowHeight * rows.length + 34 + 10;
  b = ensureSpace(b, pages, needed);

  // totals-section { border-top: 1px solid #000; padding-top: 15px }
  b.page.line(labelX - 10, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_BLACK, 1);
  b.y -= 18;

  rows.forEach((row) => {
    const rowTop = b.y;
    b.page.text(labelX, rowTop - 6, row.label, { size: 10, bold: true, color: COLOR_GRAY_333 });
    b.page.text(amountRightX, rowTop - 6, row.amount, { size: 10, bold: true, align: "right" });
    b.y -= rowHeight;
    b.page.line(labelX, b.y + 2, PDF_CONTENT_RIGHT, b.y + 2, COLOR_GRAY_DDD, 0.75);
  });

  // grand-total: border-top 2px, border-bottom 2px, bg #f5f5f5
  const gtHeight = 30;
  const gtTop = b.y;
  const gtBottom = gtTop - gtHeight;
  b.page.fillRect(labelX, gtBottom, boxWidth, gtHeight, COLOR_BG_F5);
  b.page.line(labelX, gtTop, PDF_CONTENT_RIGHT, gtTop, COLOR_BLACK, 2);
  b.page.line(labelX, gtBottom, PDF_CONTENT_RIGHT, gtBottom, COLOR_BLACK, 2);
  b.page.text(labelX + 12, gtTop - gtHeight / 2 - 4, "TOTAL AMOUNT:", { size: 12, bold: true });
  b.page.text(amountRightX - 8, gtTop - gtHeight / 2 - 4, `Rs. ${formatNumber(totalAmt)}`, { size: 12, bold: true, align: "right" });
  b.y = gtBottom - 20;

  // Payment info block (.additional-info) when there's a due balance
  const dueAmount = order.orderPayment?.due_amount ?? 0;
  if (dueAmount > 0) {
    const amountPaid = totalAmt - dueAmount;
    const blockHeight = 62;
    b = ensureSpace(b, pages, blockHeight + 10);
    const top = b.y;
    const bottom = top - blockHeight;
    b.page.fillRect(PDF_MARGIN, bottom, PDF_CONTENT_WIDTH, blockHeight, COLOR_BG_F9);
    b.page.fillRect(PDF_MARGIN, bottom, 3, blockHeight, COLOR_BLACK);
    let ry = top - 14;
    b.page.text(PDF_MARGIN + 10, ry, "Payment Information", { size: 10.5, bold: true });
    ry -= 16;
    b.page.text(PDF_MARGIN + 10, ry, `Amount Paid: Rs. ${formatNumber(amountPaid)}`, { size: 9.5 });
    ry -= 14;
    b.page.text(PDF_MARGIN + 10, ry, `Due Amount: Rs. ${formatNumber(dueAmount)}`, { size: 9.5 });
    b.y = bottom - 16;
  }

  return b;
}

function drawFooter(b: PageBudget, pages: PdfPage[], order: any, company: InvoiceCompanyInfo): PageBudget {
  const email = company.email ?? "info@gargdental.com";
  const phone = company.phone ?? "+977-1-1234567";
  const paymentStatus = String(order.payment_status ?? order.paymentStatus ?? "unpaid");

  const needed = 90;
  b = ensureSpace(b, pages, needed);

  const centerX = PDF_MARGIN + PDF_CONTENT_WIDTH / 2;
  b.page.line(PDF_MARGIN, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_GRAY_CCC, 1);
  b.y -= 22;

  b.page.text(centerX, b.y, "Thank you for your business!", { size: 11, bold: true, align: "center" });
  b.y -= 16;
  b.page.text(centerX, b.y, `For any queries regarding this invoice, please contact us at ${email} or call ${phone}`, {
    size: 9,
    color: COLOR_GRAY_666,
    align: "center",
  });
  b.y -= 14;
  b.page.text(centerX, b.y, "Payment Terms: Net 30 days | All prices are in Nepalese Rupees (NPR)", {
    size: 9,
    color: COLOR_GRAY_666,
    align: "center",
  });
  b.y -= 14;

  if (paymentStatus === "unpaid") {
    b.page.text(centerX, b.y, "Note: Please ensure payment is made within the specified terms. Late payments may incur additional charges.", { size: 9, bold: true, align: "center" });
    b.y -= 14;
function drawFooter(b: PageBudget, pages: PdfPage[], order: any, company: InvoiceCompanyInfo): PageBudget {
  const email = company.email ?? "info@gargdental.com";
  const phone = company.phone ?? "+977-1-1234567";
  const paymentStatus = String(order.payment_status ?? order.paymentStatus ?? "unpaid");

  const needed = 90;
  b = ensureSpace(b, pages, needed);

  const centerX = PDF_MARGIN + PDF_CONTENT_WIDTH / 2;
  b.page.line(PDF_MARGIN, b.y, PDF_CONTENT_RIGHT, b.y, COLOR_GRAY_CCC, 1);
  b.y -= 22;

  b.page.text(centerX, b.y, "Thank you for your business!", { size: 11, bold: true, align: "center" });
  b.y -= 16;
  b.page.text(centerX, b.y, `For any queries regarding this invoice, please contact us at ${email} or call ${phone}`, {
    size: 9,
    color: COLOR_GRAY_666,
    align: "center",
  });
  b.y -= 14;
  b.page.text(centerX, b.y, "Payment Terms: Net 30 days | All prices are in Nepalese Rupees (NPR)", {
    size: 9,
    color: COLOR_GRAY_666,
    align: "center",
  });
  b.y -= 14;

  if (paymentStatus === "unpaid") {
    b.page.text(centerX, b.y, "Note: Please ensure payment is made within the specified terms. Late payments may incur additional charges.", { size: 9, bold: true, align: "center" });
    b.y -= 14;
  }

  return b;
}

/* ------------------------------------------------------------------ */
/* PDF document assembly                                              */
/* ------------------------------------------------------------------ */
  return b;
}

/* ------------------------------------------------------------------ */
/* PDF document assembly                                              */
/* ------------------------------------------------------------------ */

function buildPdfDocument(pages: PdfPage[]): Buffer {
function buildPdfDocument(pages: PdfPage[]): Buffer {
  const objects = new Map<number, string>();
  const pageIds: number[] = [];

  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((page, index) => {
    const content = page.toContentStream();
  pages.forEach((page, index) => {
    const content = page.toContentStream();
    const contentId = 5 + index * 2;
    const pageId = contentId + 1;
    pageIds.push(pageId);
    objects.set(contentId, `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
    objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
  });

  objects.set(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");

  const orderedIds = Array.from(objects.keys()).sort((a, b) => a - b);
  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  for (const id of orderedIds) {
    offsets[id] = Buffer.byteLength(chunks.join(""), "utf8");
    chunks.push(`${id} 0 obj\n${objects.get(id)}\nendobj\n`);
  }

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  const maxId = orderedIds[orderedIds.length - 1] || 0;
  const xref: string[] = [`xref`, `0 ${maxId + 1}`, `0000000000 65535 f `];
  for (let id = 1; id <= maxId; id += 1) {
    const offset = offsets[id] || 0;
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
  }

  chunks.push(`${xref.join("\n")}\n`);
  chunks.push(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(chunks.join(""), "utf8");
}

export function buildInvoicePdfBuffer(order: any, company: InvoiceCompanyInfo): Buffer {
  order = normalizeInvoiceOrder(order);
  const pages: PdfPage[] = [];
  let budget = newPage(pages);

  drawHeader(budget, order, company);
  budget = drawInfoSection(budget, pages, order);
  budget = drawItemsSection(budget, pages, order);
  budget = drawTotalsSection(budget, pages, order);
  budget = drawFooter(budget, pages, order, company);

  return buildPdfDocument(pages);
  return buildPdfDocument(pages);
}
