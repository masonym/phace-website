import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ProductService } from '@/lib/services/productService';
import { ProductWaitlistService } from '@/lib/services/productWaitlistService';
import { escapeHtml } from '@/lib/utils/escapeHtml';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
    try {
        const { productId, variationId, name, email } = await request.json();

        if (typeof productId !== 'string' || !productId) {
            return NextResponse.json({ error: 'Missing product.' }, { status: 400 });
        }
        if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim()) || email.length > 254) {
            return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
        }

        // Look the product up rather than trusting names from the client
        let product;
        try {
            product = await ProductService.getProductById(productId);
        } catch {
            return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
        }
        if (!(product.itemData as any)?.coming_soon) {
            return NextResponse.json({ error: 'This product is not taking waitlist signups.' }, { status: 400 });
        }

        const productName = product.itemData?.name ?? 'Unnamed product';
        const variation = typeof variationId === 'string'
            ? product.itemData?.variations?.find((v) => v.id === variationId)
            : undefined;
        const variationName = variation?.type === 'ITEM_VARIATION' && (product.itemData?.variations?.length ?? 0) > 1
            ? variation.itemVariationData?.name ?? undefined
            : undefined;
        const cleanEmail = email.trim();
        const cleanName = typeof name === 'string' && name.trim() ? name.trim().slice(0, 100) : undefined;

        const added = await ProductWaitlistService.add({
            productId,
            productName,
            variationId: variationName ? variation?.id : undefined,
            variationName,
            name: cleanName,
            email: cleanEmail,
        });

        // Already on the list: report success without emailing the clinic again
        if (!added) {
            return NextResponse.json({ success: true });
        }

        const productLabel = variationName ? `${productName} (${variationName})` : productName;
        const who = cleanName ? `${cleanName} <${cleanEmail}>` : cleanEmail;

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: 'hello@phace.ca',
                replyTo: cleanEmail,
                subject: `Waitlist signup: ${productLabel}`,
                text: `${who} joined the waitlist for ${productLabel}.\n\nSee everyone on the list under Admin > Product Waitlist.`,
                html: `<p><strong>${escapeHtml(who)}</strong> joined the waitlist for <strong>${escapeHtml(productLabel)}</strong>.</p><p>See everyone on the list under Admin &gt; Product Waitlist.</p>`,
            });
        } catch (error) {
            // The signup is saved, so don't fail the request over the notification
            console.error('Error sending product waitlist notification:', error);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error handling product waitlist signup:', error);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
