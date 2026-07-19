// invoicePdf.ts
// Generates the same black & white invoice HTML design as invoice.blade.php,
// but as a TypeScript string builder for Next.js (use with puppeteer / @react-pdf,
// or any HTML-to-PDF service).

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

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
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

/* ------------------------------------------------------------------ */
/* Main builder                                                        */
/* ------------------------------------------------------------------ */

export function buildInvoicePdfHtml(
  order: InvoiceOrder,
  company: InvoiceCompanyInfo
): string {
  const now = new Date();

  const companyName = escapeHtml(company.company_name);
  const addressLine = escapeHtml(
    company.address_line ?? "123 Dental Plaza, Medical District"
  );
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
      const skuRow = item.product.sku
        ? `<div class="product-sku">SKU: ${escapeHtml(item.product.sku)}</div>`
        : "";
      return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <div class="product-name">${escapeHtml(
                              item.product.product_name
                            )}</div>
                            ${skuRow}
                        </td>
                        <td class="text-center">${escapeHtml(item.quantity)}</td>
                        <td class="text-right">Rs. ${formatNumber(
                          item.actual_price
                        )}</td>
                        <td class="text-right">Rs. ${formatNumber(
                          item.subtotal_without_tax
                        )}</td>
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

  const deliveryDateRow =
    order.order_status === "delivered" && order.delivered_at
      ? `<div class="info-row"><span class="info-label">Delivery:</span><span class="info-value">${formatDateLong(
          order.delivered_at
        )}</span></div>`
      : "";

  const dueBadge = hasDue
    ? `<span class="status-badge due">Due Remaining</span>`
    : "";

  const discountRow =
    order.discount > 0
      ? `<tr><td class="label">Discount:</td><td class="amount">- Rs. ${formatNumber(
          order.discount
        )}</td></tr>`
      : "";

  const paymentInfoBlock = hasDue
    ? `
        <div class="additional-info">
            <strong>&#128176; Payment Information</strong><br>
            <strong>Amount Paid:</strong> Rs. ${formatNumber(amountPaid)}<br>
            <strong>Due Amount:</strong> Rs. ${formatNumber(dueAmount)}
        </div>`
    : "";

  const unpaidNote =
    order.payment_status === "unpaid"
      ? `<p><strong>Note:</strong> Please ensure payment is made within the specified terms. Late payments may incur additional charges.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${companyName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.5;
            color: #000;
            background-color: #fff;
            font-size: 14px;
        }

        .container {
            width: 100%;
            max-width: 800px;
            margin: auto;
            background: white;
        }

        /* Header Section */
        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
            width: 100%;
        }
        .header td {
            vertical-align: top;
        }

        .company-info h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .company-info p {
            font-size: 12px;
            color: #333;
            margin-bottom: 3px;
        }

        .invoice-title h2 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-align: right;
        }

        .invoice-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
            text-align: right;
        }

        .invoice-date {
            font-size: 12px;
            color: #666;
            text-align: right;
        }

        /* Info Section (Table) */
        .info-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .info-table td {
            vertical-align: top;
            padding: 0 10px;
            width: 50%;
        }

        .info-box h3 {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
            margin-bottom: 15px;
            letter-spacing: 0.5px;
        }

        .info-row {
            margin-bottom: 8px;
        }

        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
            color: #333;
        }

        .info-value {
            display: inline-block;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border: 1px solid #000;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-badge.processing { background-color: #fff; color: #000; }
        .status-badge.shipped { background-color: #f0f0f0; color: #000; }
        .status-badge.delivered { background-color: #e0e0e0; color: #000; }
        .status-badge.cancelled { background-color: #fff; color: #666; border-color: #666; }
        .status-badge.paid { background-color: #000; color: #fff; }
        .status-badge.unpaid { background-color: #fff; color: #000; }
        .status-badge.due { background-color: #f5f5f5; color: #333; }

        /* Items Table */
        .items-section { margin-bottom: 30px; }
        .items-title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
        }
        .items-table th {
            background-color: #000;
            color: #fff;
            padding: 12px 10px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #ccc;
            vertical-align: top;
        }
        .items-table tbody tr:last-child td { border-bottom: none; }
        .items-table .text-center { text-align: center; }
        .items-table .text-right { text-align: right; font-weight: bold; }
        .product-name { font-weight: bold; margin-bottom: 3px; }
        .product-sku { font-size: 11px; color: #666; }

        /* Totals Section */
        .totals-section { margin-top: 20px; border-top: 1px solid #000; padding-top: 15px; }
        .totals-table {
            width: 300px;
            margin-left: auto;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 15px;
            border-bottom: 1px solid #ddd;
        }
        .totals-table .label { font-weight: bold; text-align: right; color: #333; }
        .totals-table .amount { text-align: right; font-weight: bold; width: 120px; }
        .grand-total { border-top: 2px solid #000; border-bottom: 2px solid #000; background-color: #f5f5f5; }
        .grand-total td { padding: 12px 15px; font-size: 16px; font-weight: bold; }

        /* Additional Info */
        .additional-info {
            margin: 20px 0;
            padding: 15px;
            border-left: 3px solid #000;
            background-color: #f9f9f9;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 20px;
            font-size: 12px;
            color: #666;
        }
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
                        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${escapeHtml(
                          order.customer.full_name
                        )}</span></div>
                        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${escapeHtml(
                          order.customer.email
                        )}</span></div>
                        <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${escapeHtml(
                          order.customer.phone
                        )}</span></div>
                        <div class="info-row"><span class="info-label">Customer Since:</span><span class="info-value">${formatDateShort(
                          order.customer.created_at
                        )}</span></div>
                        <div class="info-row"><span class="info-label">Address:</span>
                            <span class="info-value">
                                ${escapeHtml(order.deliveryInformation.address)}<br>
                                ${escapeHtml(
                                  order.deliveryInformation.zone.zone_name
                                )}, ${escapeHtml(
    order.deliveryInformation.city.city
  )}<br>
                                ${escapeHtml(
                                  order.deliveryInformation.province.province_name
                                )}
                            </span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="info-box">
                        <h3>Order Details</h3>
                        <div class="info-row"><span class="info-label">Order ID:</span><span class="info-value">${escapeHtml(
                          order.order_id
                        )}</span></div>
                        <div class="info-row"><span class="info-label">Order Date:</span><span class="info-value">${formatDateLong(
                          order.created_at
                        )}</span></div>
                        <div class="info-row"><span class="info-label">Status:</span><span class="info-value"><span class="status-badge ${
                          order.order_status
                        }">${capitalize(order.order_status)}</span></span></div>
                        <div class="info-row"><span class="info-label">Payment:</span>
                            <span class="info-value">
                                <span class="status-badge ${
                                  order.payment_status
                                }">${capitalize(order.payment_status)}</span>
                                ${dueBadge}
                            </span>
                        </div>
                        <div class="info-row"><span class="info-label">Total Items:</span><span class="info-value">${escapeHtml(
                          order.total_items
                        )}</span></div>
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
                <tr><td class="label">Subtotal:</td><td class="amount">Rs. ${formatNumber(
                  order.subtotal_without_tax
                )}</td></tr>
                <tr><td class="label">Tax (13%):</td><td class="amount">Rs. ${formatNumber(
                  order.tax
                )}</td></tr>
                <tr><td class="label">Shipping:</td><td class="amount">Rs. ${formatNumber(
                  order.shipping_cost
                )}</td></tr>
                ${discountRow}
                <tr class="grand-total"><td class="label">TOTAL AMOUNT:</td><td class="amount">Rs. ${formatNumber(
                  order.total_amount
                )}</td></tr>
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

type PdfLine = {
  text: string;
  bold?: boolean;
  size?: number;
  gapAfter?: number;
};

const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const PDF_MARGIN = 42;
const PDF_LINE_HEIGHT = 15;

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

function addWrappedLine(lines: PdfLine[], text: string, options: Omit<PdfLine, "text"> = {}) {
  for (const part of wrapPdfText(text)) {
    lines.push({ text: part, ...options });
  }
}

function buildInvoicePdfLines(order: any, company: InvoiceCompanyInfo): PdfLine[] {
  const lines: PdfLine[] = [];
  const companyName = company.company_name || "Garg Dental Pvt. Ltd.";

  lines.push({ text: companyName, bold: true, size: 18, gapAfter: 6 });
  if (company.address_line) addWrappedLine(lines, company.address_line, { size: 10 });
  if (company.city_line) addWrappedLine(lines, company.city_line, { size: 10 });
  const companyContact = [company.phone ? `Phone: ${company.phone}` : "", company.email ? `Email: ${company.email}` : ""].filter(Boolean).join(" | ");
  if (companyContact) addWrappedLine(lines, companyContact, { size: 10, gapAfter: 4 });

  lines.push({ text: `Invoice #${order.orderId || order.order_id || ""}`, bold: true, size: 15, gapAfter: 4 });
  addWrappedLine(lines, `Order Status: ${order.orderStatus || order.order_status || "processing"}`, { size: 10 });
  addWrappedLine(lines, `Payment Status: ${order.paymentStatus || order.payment_status || "unpaid"}`, { size: 10 });
  addWrappedLine(lines, `Payment Method: ${order.paymentMethod || order.payment_method || "-"}`, { size: 10 });
  addWrappedLine(lines, `Customer: ${order.customer || order.customerInfo?.email || ""}`, { size: 10 });
  addWrappedLine(lines, `Email: ${order.customerInfo?.email || ""}`, { size: 10 });
  addWrappedLine(lines, `Phone: ${order.customerInfo?.phone || ""}`, { size: 10, gapAfter: 4 });

  const ship = order.shippingInfo || {};
  const shippingLines = [
    ship.method ? `Shipping Method: ${ship.method}` : "",
    ship.province ? `Province: ${ship.province}` : "",
    ship.city ? `City: ${ship.city}` : "",
    ship.zone ? `Zone: ${ship.zone}` : "",
    ship.streetAddress ? `Address: ${ship.streetAddress}` : "",
  ].filter(Boolean);

  if (shippingLines.length) {
    lines.push({ text: "Shipping Info", bold: true, size: 12, gapAfter: 2 });
    shippingLines.forEach((line) => addWrappedLine(lines, line, { size: 10 }));
    lines.push({ text: "", size: 10, gapAfter: 4 });
  }

  lines.push({ text: "Items Ordered", bold: true, size: 12, gapAfter: 4 });
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    lines.push({ text: "No items found.", size: 10, gapAfter: 4 });
  } else {
    items.forEach((item, index) => {
      const productName = item.product || item.product_name || item.product_code || "Product";
      const qty = Number(item.qty || item.quantity || 0);
      const unitPrice = Number(item.unitPrice || item.price || item.actual_price || 0);
      const subtotal = Number(item.subtotal || qty * unitPrice || 0);

      addWrappedLine(lines, `${index + 1}. ${productName}`, { bold: true, size: 10 });
      addWrappedLine(lines, `   Qty: ${qty} | Unit: Rs. ${formatNumber(unitPrice)} | Amount: Rs. ${formatNumber(subtotal)}`, { size: 10, gapAfter: 2 });
    });
  }

  lines.push({ text: "Totals", bold: true, size: 12, gapAfter: 2 });
  addWrappedLine(lines, `Subtotal: Rs. ${formatNumber(Number(order.summary?.subtotal || order.subtotal_without_tax || 0))}`, { size: 10 });
  addWrappedLine(lines, `Tax: Rs. ${formatNumber(Number(order.summary?.tax || order.tax || 0))}`, { size: 10 });
  addWrappedLine(lines, `Shipping: Rs. ${formatNumber(Number(order.summary?.shippingCost || order.shipping_cost || 0))}`, { size: 10 });
  addWrappedLine(lines, `Grand Total: Rs. ${formatNumber(Number(order.summary?.totalAmount || order.total_amount || 0))}`, { size: 10, gapAfter: 4 });

  lines.push({ text: `Generated on ${formatDateTime(new Date())}`, size: 9, gapAfter: 2 });
  addWrappedLine(lines, "Thank you for choosing Garg Dental.", { size: 10 });

  return lines;
}

function renderPdfPage(pageLines: PdfLine[]): string {
  const commands: string[] = [];
  let y = PDF_PAGE_HEIGHT - PDF_MARGIN;

  for (const line of pageLines) {
    const font = line.bold ? "/F2" : "/F1";
    const size = line.size || 10;
    const safeText = sanitizePdfText(line.text);
    commands.push(`BT ${font} ${size} Tf 1 0 0 1 ${PDF_MARGIN} ${y} Tm (${safeText}) Tj ET`);
    y -= line.gapAfter ? size + line.gapAfter : PDF_LINE_HEIGHT;
  }

  return commands.join("\n");
}

function buildPdfDocument(pageChunks: PdfLine[][]): Buffer {
  const objects = new Map<number, string>();
  const pageIds: number[] = [];

  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pageChunks.forEach((chunk, index) => {
    const content = renderPdfPage(chunk);
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
  const lines = buildInvoicePdfLines(order, company);
  const pages: PdfLine[][] = [];
  const linesPerPage = 42;

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  return buildPdfDocument(pages.length ? pages : [[{ text: "No invoice data", size: 12 }]]);
}
