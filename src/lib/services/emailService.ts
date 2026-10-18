import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { escapeHtml } from '@/lib/utils/escapeHtml';
import { CLINIC, CLINIC_ADDRESS_ONE_LINE } from '@/lib/config/clinicInfo';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

export interface OrderEmailItem {
    name: string;
    variationName?: string;
    quantity: string;
    totalFormatted: string;
}

export interface OrderConfirmationData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    items: OrderEmailItem[];
    subtotalFormatted: string;
    taxFormatted: string;
    discountFormatted?: string;
    totalFormatted: string;
    fulfillmentMethod: 'shipping' | 'pickup';
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    receiptUrl?: string;
}

export interface OrderStatusEmailData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    status: 'ready' | 'shipped';
    items: { name: string; variationName?: string; quantity: string }[];
    trackingNumber?: string;
    carrier?: string;
}

export class EmailService {
    /** Wraps table rows in the PHACE header, card and footer used by every customer email */
    private static wrapInBrandedShell(rows: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFBF0;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBF0;">
    <tr>
        <td align="center" style="padding:40px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                    <td align="center" style="background-color:#B09182;padding:36px 40px;">
                        <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:6px;text-transform:uppercase;">PHACE</h1>
                        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;text-transform:uppercase;">Medical Aesthetics &amp; Wellness</p>
                    </td>
                </tr>

${rows}

                <!-- Footer -->
                <tr>
                    <td style="background-color:#EBE5D5;padding:24px 40px;text-align:center;">
                        <p style="margin:0 0 6px;color:#59637E;font-size:13px;">Questions? Contact us at <a href="mailto:hello@phace.ca" style="color:#B09182;text-decoration:none;">hello@phace.ca</a></p>
                        <p style="margin:0;color:#999;font-size:12px;">Phace Medical Aesthetics &amp; Wellness &mdash; Chilliwack, BC</p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>`;
    }

    private static buildOrderConfirmationHtml(data: OrderConfirmationData): string {
        const itemRows = data.items.map(item => `
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #EBE5D5;color:#59637E;font-size:15px;">
                    ${item.name}${item.variationName ? ` <span style="color:#999;font-size:13px;">(${item.variationName})</span>` : ''}
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #EBE5D5;color:#59637E;font-size:15px;text-align:center;">
                    ${item.quantity}
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #EBE5D5;color:#59637E;font-size:15px;text-align:right;">
                    ${item.totalFormatted}
                </td>
            </tr>
        `).join('');

        const discountRow = data.discountFormatted ? `
            <tr>
                <td colspan="2" style="padding:6px 0;color:#59637E;font-size:14px;text-align:right;">Discount</td>
                <td style="padding:6px 0;color:#B09182;font-size:14px;text-align:right;">-${data.discountFormatted}</td>
            </tr>
        ` : '';

        const fulfillmentSection = data.fulfillmentMethod === 'shipping' && data.shippingAddress ? `
            <tr>
                <td style="padding:24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="background-color:#EBE5D5;border-radius:8px;padding:20px;">
                                <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Shipping To</p>
                                <p style="margin:0;color:#59637E;font-size:14px;line-height:1.6;">
                                    ${data.customerName}<br>
                                    ${data.shippingAddress.street}<br>
                                    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br>
                                    Canada
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        ` : `
            <tr>
                <td style="padding:24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="background-color:#EBE5D5;border-radius:8px;padding:20px;">
                                <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Local Pickup</p>
                                <p style="margin:0;color:#59637E;font-size:14px;line-height:1.6;">
                                    Phace Medical Aesthetics &amp; Wellness<br>
                                    Chilliwack, BC
                                </p>
                                <p style="margin:8px 0 0;color:#999;font-size:13px;">We'll contact you when your order is ready for pickup.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;

        const receiptButton = data.receiptUrl ? `
            <tr>
                <td style="padding:0 40px 32px;" align="center">
                    <a href="${data.receiptUrl}" target="_blank"
                        style="display:inline-block;background-color:#B09182;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:50px;letter-spacing:1px;">
                        View Receipt
                    </a>
                </td>
            </tr>
        ` : '';

        return EmailService.wrapInBrandedShell(`
                <!-- Thank you -->
                <tr>
                    <td style="padding:36px 40px 20px;text-align:center;">
                        <h2 style="margin:0 0 10px;color:#59637E;font-size:22px;font-weight:600;">Thank You, ${data.customerName.split(' ')[0]}!</h2>
                        <p style="margin:0;color:#999;font-size:15px;line-height:1.6;">Your order has been confirmed and is being prepared.</p>
                    </td>
                </tr>

                <!-- Order reference -->
                <tr>
                    <td style="padding:0 40px 28px;" align="center">
                        <div style="display:inline-block;background-color:#EBE5D5;border-radius:8px;padding:14px 28px;text-align:center;">
                            <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Order Reference</p>
                            <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#59637E;font-family:monospace;">${data.orderId}</p>
                        </div>
                    </td>
                </tr>

                <!-- Items -->
                <tr>
                    <td style="padding:0 40px 8px;">
                        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#B09182;text-transform:uppercase;letter-spacing:1.5px;border-bottom:2px solid #DEC3C5;padding-bottom:8px;">Order Summary</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <th style="font-size:12px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;text-align:left;">Item</th>
                                <th style="font-size:12px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;text-align:center;">Qty</th>
                                <th style="font-size:12px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;text-align:right;">Price</th>
                            </tr>
                            ${itemRows}
                        </table>
                    </td>
                </tr>

                <!-- Totals -->
                <tr>
                    <td style="padding:8px 40px 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td colspan="2" style="padding:6px 0;color:#999;font-size:14px;text-align:right;">Subtotal</td>
                                <td style="padding:6px 0;color:#59637E;font-size:14px;text-align:right;width:80px;">${data.subtotalFormatted}</td>
                            </tr>
                            ${discountRow}
                            <tr>
                                <td colspan="2" style="padding:6px 0;color:#999;font-size:14px;text-align:right;">Tax</td>
                                <td style="padding:6px 0;color:#59637E;font-size:14px;text-align:right;">${data.taxFormatted}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding:12px 0 0;border-top:2px solid #DEC3C5;color:#59637E;font-size:16px;font-weight:700;text-align:right;">Total</td>
                                <td style="padding:12px 0 0;border-top:2px solid #DEC3C5;color:#B09182;font-size:16px;font-weight:700;text-align:right;">${data.totalFormatted}</td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Fulfillment -->
                ${fulfillmentSection}

                <!-- Receipt button -->
                ${receiptButton}
`);
    }

    static async sendOrderConfirmation(data: OrderConfirmationData) {
        const command = new SendEmailCommand({
            Source: process.env.SES_SENDER_EMAIL,
            Destination: {
                ToAddresses: [data.customerEmail],
            },
            Message: {
                Subject: {
                    Data: `Order Confirmed — Thank you, ${data.customerName.split(' ')[0]}!`,
                },
                Body: {
                    Html: {
                        Data: EmailService.buildOrderConfirmationHtml(data),
                    },
                },
            },
        });

        return await sesClient.send(command);
    }

    static async sendOrderStatusUpdate(data: OrderStatusEmailData) {
        const firstName = escapeHtml(data.customerName.split(' ')[0] || 'there');
        const itemList = data.items.map(item => `
            <li style="margin:0 0 6px;">${escapeHtml(item.name)}${item.variationName ? ` (${escapeHtml(item.variationName)})` : ''} &times; ${escapeHtml(item.quantity)}</li>
        `).join('');

        const isShipped = data.status === 'shipped';
        const heading = isShipped ? 'Your order is on its way' : 'Your order is ready for pickup';
        const intro = isShipped
            ? `Good news, ${firstName}! Your order has shipped.`
            : `Good news, ${firstName}! Your order is ready to pick up at the clinic.`;

        const detailBox = isShipped
            ? (data.trackingNumber ? `
                <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Tracking</p>
                <p style="margin:0;color:#59637E;font-size:15px;font-weight:700;font-family:monospace;">${escapeHtml(data.trackingNumber)}</p>
                ${data.carrier ? `<p style="margin:4px 0 0;color:#59637E;font-size:14px;">${escapeHtml(data.carrier)}</p>` : ''}
            ` : '')
            : `
                <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Pickup Location</p>
                <p style="margin:0;color:#59637E;font-size:14px;line-height:1.6;">
                    ${escapeHtml(CLINIC.name)}<br>
                    ${escapeHtml(CLINIC_ADDRESS_ONE_LINE)}
                </p>
            `;

        const html = EmailService.wrapInBrandedShell(`
                <tr>
                    <td style="padding:36px 40px 20px;text-align:center;">
                        <h2 style="margin:0 0 10px;color:#59637E;font-size:22px;font-weight:600;">${heading}</h2>
                        <p style="margin:0;color:#999;font-size:15px;line-height:1.6;">${intro}</p>
                        <p style="margin:12px 0 0;font-size:13px;color:#999;">Order <span style="font-family:monospace;color:#59637E;">${escapeHtml(data.orderId)}</span></p>
                    </td>
                </tr>
                ${detailBox ? `
                <tr>
                    <td style="padding:0 40px 24px;">
                        <div style="background-color:#EBE5D5;border-radius:8px;padding:20px;">${detailBox}</div>
                    </td>
                </tr>` : ''}
                <tr>
                    <td style="padding:0 40px 32px;">
                        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#B09182;text-transform:uppercase;letter-spacing:1.5px;border-bottom:2px solid #DEC3C5;padding-bottom:8px;">Your Items</p>
                        <ul style="margin:0;padding-left:20px;color:#59637E;font-size:15px;">${itemList}</ul>
                    </td>
                </tr>`);

        const command = new SendEmailCommand({
            Source: process.env.SES_SENDER_EMAIL,
            Destination: {
                ToAddresses: [data.customerEmail],
            },
            Message: {
                Subject: {
                    Data: isShipped ? 'Your Phace order has shipped' : 'Your Phace order is ready for pickup',
                },
                Body: {
                    Html: {
                        Data: html,
                    },
                },
            },
        });

        return await sesClient.send(command);
    }
}
