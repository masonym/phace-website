import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { escapeHtml } from '@/lib/utils/escapeHtml'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// There's no mailing-list provider yet, so signups are emailed to the clinic to add by hand
export async function POST(request: Request) {
  try {
    const { email, consent } = await request.json()

    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (consent !== true) {
      return NextResponse.json({ error: 'Please confirm you would like to receive our newsletter.' }, { status: 400 })
    }

    const cleanEmail = email.trim()
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'hello@phace.ca',
      replyTo: cleanEmail,
      subject: `Newsletter signup: ${cleanEmail}`,
      text: `${cleanEmail} signed up for the newsletter on the website and agreed to receive emails (${new Date().toISOString()}).`,
      html: `<p><strong>${escapeHtml(cleanEmail)}</strong> signed up for the newsletter on the website and agreed to receive emails.</p><p>${new Date().toISOString()}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling newsletter signup:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
