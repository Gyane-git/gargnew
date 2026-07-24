
const BASE_URL = process.env.BASE_URL || "https://gagrdental.com";

export interface LandingData {
  company_logo_header?: string;
  company_name?: string;
  website_link?: string;
  primary_phone?: string;
}

export interface OrderItem {
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  final_price?: number;
}

export type OrderStatus = "cancelled" | "shipped" | "delivered" | string;

export interface OrderStatusEmailParams {
  landingData?: LandingData;
  status: OrderStatus;
  customerName: string;
  orderNumber: string | number;
  shippingCarrier?: string;
  shippingCharge?: number;
  remarks?: string;
  orderItems: OrderItem[];
}

export interface OrderReceivedEmailParams {
  landingData?: LandingData;
  customerName: string;
  includeInvoiceNote?: boolean;
}

export interface OrderInvoiceEmailParams {
  landingData?: LandingData;
  customerName: string;
  orderNumber: string | number;
}

/** Small helper mirroring PHP's number_format($n, 2) */
function formatMoney(value: number | undefined | null): string {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return n.toFixed(2);
}

/** Resolve a possibly-relative logo/asset path against BASE_URL */
function resolveUrl(path?: string): string {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Builds the "Order Update" email (cancelled / shipped / delivered / generic).
 * Mirrors the original Blade template's conditional heading, body copy,
 * shipping carrier line, per-item pricing with shipping folded into the
 * first/only total, and remarks block.
 */
export function buildOrderStatusEmail(params: OrderStatusEmailParams): string {
  const {
    landingData = {},
    status,
    customerName,
    orderNumber,
    shippingCarrier,
    shippingCharge,
    remarks,
    orderItems,
  } = params;

  const companyName = landingData.company_name || "Garg Dental";
  const logoUrl = resolveUrl(landingData.company_logo_header);

  const heading =
    status === "cancelled"
      ? "Order Cancellation Confirmation"
      : status === "shipped"
      ? "Your Order Has Been Shipped"
      : status === "delivered"
      ? "Order Delivered Successfully"
      : "Order Update";

  const statusMessage =
    status === "cancelled"
      ? `<p>We are sorry to inform you that your order number <strong>#${orderNumber}</strong> has been cancelled.</p>`
      : status === "shipped"
      ? `<p>Your order number <strong>#${orderNumber}</strong> has been shipped.</p>${
          shippingCarrier
            ? `<p><strong>Shipping Carrier:</strong> ${shippingCarrier}</p>`
            : ""
        }`
      : status === "delivered"
      ? `<p>Your order number <strong>#${orderNumber}</strong> has been delivered.</p>`
      : "";

  const itemsRows =
    orderItems && orderItems.length > 0
      ? orderItems
          .map((item, index) => {
            const productName = item.product_name ?? "N/A";
            const quantity = item.quantity ?? 0;
            const unitPrice =
              typeof item.unit_price === "number" ? formatMoney(item.unit_price) : "N/A";

            // Mirror original logic: shipping is added once, onto the first row's total.
            let finalPrice = item.final_price ?? 0;
            if (index === 0 && shippingCharge) {
              finalPrice += shippingCharge;
            }

            return `
                <tr>
                    <td>${productName}</td>
                    <td>${quantity}</td>
                    <td>${unitPrice}</td>
                    <td>${formatMoney(finalPrice)}</td>
                </tr>`;
          })
          .join("")
      : `
                <tr>
                    <td colspan="4">No items found for this order.</td>
                </tr>`;

  const remarksBlock = remarks
    ? `<p class="remarks">Remarks: ${remarks}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Update</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 5px;
            max-width: 700px;
            margin: auto;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            max-width: 200px;
            height: auto;
        }
        h1, h2 {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        table th {
            background-color: #f2f2f2;
        }
        .remarks {
            margin-top: 20px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}">` : ""}
    </div>

    <div class="content">
        <h1>${heading}</h1>

        <p>Dear ${customerName},</p>

        ${statusMessage}

        <h2>Order Details:</h2>
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Final Price</th>
                </tr>
            </thead>
            <tbody>${itemsRows}
            </tbody>
        </table>

        ${remarksBlock}

        <p>If you have any questions regarding your order, please contact our customer support.</p>
        <p style="margin-top:30px">— <br><strong>Team Garg Dental Pvt. Ltd.</strong></p>
        <div class="contact-info">
            <p><a class="website" href="https://gargdental.com/" target="_blank">http.com/</a> | 01-4536276</p>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for choosing ${companyName}.</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
</div>
</body>
</html>`;
}

/**
 * Builds the "Order Received" confirmation email.
 * Mirrors the original Blade template's static copy with dynamic
 * customer name, logo, website link, and phone number.
 */
function buildOrderReceivedEmailHtml(params: OrderReceivedEmailParams): string {
  const { landingData = {}, customerName, includeInvoiceNote = false } = params;

  const logoUrl = resolveUrl(landingData.company_logo_header);
  const websiteLink = landingData.website_link || `${BASE_URL}/`;
  const primaryPhone = landingData.primary_phone || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Received - Garg Dental Pvt. Ltd.</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f8f8f8;
            margin: 0;
            padding: 30px;
        }
        .email-container {
            background-color: #ffffff;
            max-width: 600px;
            margin: auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        .header {
            text-align: center;
            padding: 30px 20px 20px;
        }
        .header img {
            max-width: 150px;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px 20px;
            color: #333;
            line-height: 1.6;
        }
        .content h1 {
            font-size: 22px;
            color: #007BFF;
        }
        .content p {
            margin: 15px 0;
        }
        .footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777;
        }
        .contact-info {
            margin-top: 15px;
        }
        a.website {
            color: #007BFF;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Garg Dental Pvt. Ltd.">` : ""}
        </div>

        <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>

            <p>Your order with <strong>Garg Dental Pvt. Ltd.</strong> has been successfully received — and our team is already working to get it to you as soon as possible! 🦷✨</p>

            <p>Got any questions or special instructions? Just hit <strong>Reply</strong> — we're always here to help.</p>

            <p>Stay tuned! We'll update you when your order is on its way.</p>

            <p><strong>Thank you for trusting Garg Dental — your smile is our priority!</strong></p>

            ${includeInvoiceNote ? "<p><strong>Your invoice is attached with this mail.</strong></p>" : ""}

            <p style="margin-top: 30px;">— <br><strong>Team Garg Dental Pvt. Ltd.</strong></p>

            <div class="contact-info">
                <p><a class="website" href="${websiteLink}">${websiteLink}</a> | ${primaryPhone}</p>
            </div>
        </div>

        <div class="footer">
            &copy; ${new Date().getFullYear()} Garg Dental Pvt. Ltd. All rights reserved.
        </div>
    </div>
</body>
</html>`;
}

export function buildOrderReceivedEmail(params: OrderReceivedEmailParams): string {
  return buildOrderReceivedEmailHtml(params);
}

export function buildOrderInvoiceEmail(params: OrderInvoiceEmailParams): string {
  const { landingData = {}, customerName, orderNumber } = params;
  const websiteLink = landingData.website_link || `${BASE_URL}/`;
  const primaryPhone = landingData.primary_phone || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice Ready</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f8f8f8;
            margin: 0;
            padding: 30px;
        }
        .email-container {
            background-color: #ffffff;
            max-width: 600px;
            margin: auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        .content {
            padding: 30px 20px;
            color: #333;
            line-height: 1.6;
        }
        .footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777;
        }
        .contact-info {
            margin-top: 15px;
        }
        a.website {
            color: #007BFF;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>

            <p>Your invoice for order <strong>#${orderNumber}</strong> is attached with this email.</p>

            <p>If you have any questions, please reply to this email or contact our support team.</p>

            <p style="margin-top: 30px;">— <br><strong>Team Garg Dental Pvt. Ltd.</strong></p>

            <div class="contact-info">
                <p><a class="website" href="${websiteLink}">${websiteLink}</a> | ${primaryPhone}</p>
            </div>
        </div>

        <div class="footer">
            &copy; ${new Date().getFullYear()} Garg Dental Pvt. Ltd. All rights reserved.
        </div>
    </div>
</body>
</html>`;
}
