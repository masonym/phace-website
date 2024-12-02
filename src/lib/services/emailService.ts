import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

export class EmailService {
    static async sendOrderConfirmation(order: any, customerEmail: string) {
        const command = new SendEmailCommand({
            Source: process.env.SES_SENDER_EMAIL,
            Destination: {
                ToAddresses: [customerEmail],
            },
            Message: {
                Subject: {
                    Data: `Order Confirmation #${order.id}`,
                },
                Body: {
                    Html: {
                        Data: `
                            <h1>Thank you for your order!</h1>
                            <p>Order #${order.id} has been confirmed.</p>
                            <h2>Order Details:</h2>
                            <ul>
                                ${order.items.map((item: any) => `
                                    <li>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
                                `).join('')}
                            </ul>
                            <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
                            <p>We'll notify you when your order ships.</p>
                        `,
                    },
                },
            },
        });

        return await sesClient.send(command);
    }

    static async sendOrderStatusUpdate(order: any, customerEmail: string, status: string) {
        const command = new SendEmailCommand({
            Source: process.env.SES_SENDER_EMAIL,
            Destination: {
                ToAddresses: [customerEmail],
            },
            Message: {
                Subject: {
                    Data: `Order ${status.charAt(0).toUpperCase() + status.slice(1)} - #${order.id}`,
                },
                Body: {
                    Html: {
                        Data: `
                            <h1>Order Status Update</h1>
                            <p>Your order #${order.id} has been ${status}.</p>
                            ${status === 'shipped' ? `
                                <p>Tracking number: ${order.trackingNumber}</p>
                                <p>Carrier: ${order.carrier}</p>
                            ` : ''}
                            <h2>Order Details:</h2>
                            <ul>
                                ${order.items.map((item: any) => `
                                    <li>${item.name} x ${item.quantity}</li>
                                `).join('')}
                            </ul>
                        `,
                    },
                },
            },
        });

        return await sesClient.send(command);
    }

    static async sendAdminNotification(order: any) {
        const command = new SendEmailCommand({
            Source: process.env.SES_SENDER_EMAIL,
            Destination: {
                ToAddresses: [process.env.ADMIN_EMAIL!],
            },
            Message: {
                Subject: {
                    Data: `New Order Received - #${order.id}`,
                },
                Body: {
                    Html: {
                        Data: `
                            <h1>New Order Received</h1>
                            <p>Order #${order.id} has been placed.</p>
                            <h2>Order Details:</h2>
                            <ul>
                                ${order.items.map((item: any) => `
                                    <li>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
                                `).join('')}
                            </ul>
                            <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
                            <h2>Shipping Address:</h2>
                            <p>
                                ${order.shippingAddress.name}<br>
                                ${order.shippingAddress.street}<br>
                                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                                ${order.shippingAddress.country}
                            </p>
                        `,
                    },
                },
            },
        });

        return await sesClient.send(command);
    }
}
