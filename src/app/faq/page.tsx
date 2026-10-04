import type { Metadata } from 'next'
import Link from 'next/link'
import { CLINIC, CLINIC_ADDRESS_ONE_LINE, OPENING_HOURS, formatOpeningHours } from '@/lib/config/clinicInfo'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers about booking, cancellations, payment, financing, gift cards, shipping and visiting Phace Medical Aesthetics in Chilliwack, BC.',
}

// Every answer here restates something already published elsewhere on the site.
// Update the source page (policies, clinicInfo) together with this list.
const FAQS: { question: string; answer: React.ReactNode; plain: string }[] = [
  {
    question: 'How do I book an appointment?',
    plain: 'Book online any time from the Book Now button: choose a service, provider, date and time. You can also call us.',
    answer: (
      <>
        Book online any time from <Link href="/book" className="text-accent underline">Book Now</Link>: choose a
        service, provider, date and time. You can also call us at{' '}
        <a href={CLINIC.phoneHref} className="text-accent underline">{CLINIC.phoneDisplay}</a>.
      </>
    ),
  },
  {
    question: 'Why do you need my credit card to book?',
    plain: 'A credit card is required to book and hold your appointment time, but you will not be charged at that time.',
    answer: (
      <>
        A credit card is required to book and hold your appointment time, but you will not be charged when you book.
        It is only used under our <Link href="/booking-policy" className="text-accent underline">booking policy</Link>{' '}
        for late cancellations and missed appointments.
      </>
    ),
  },
  {
    question: 'What is your cancellation policy?',
    plain: 'Please give at least 24 hours notice to cancel or reschedule. Changes with less notice are charged 50% of the service fee, and no-shows are charged 100%.',
    answer: (
      <>
        Please give us at least 24 hours&apos; notice to cancel or reschedule. Changes with less notice are charged 50%
        of the service fee, and missed appointments are charged 100%.{' '}
        <Link href="/booking-policy" className="text-accent underline">Read the full booking policy</Link>.
      </>
    ),
  },
  {
    question: 'What if I am running late?',
    plain: 'Please let us know. There is a 15 minute grace period, but we may not be able to complete your full service. After 15 minutes the appointment is cancelled or rescheduled and the late cancellation fee applies.',
    answer: (
      <>
        Please let us know. We have a 15 minute grace period, but we can&apos;t guarantee your full service in the
        time remaining. After 15 minutes we&apos;ll need to cancel or reschedule, and the 50% late cancellation fee
        applies.
      </>
    ),
  },
  {
    question: "What if I can't find a time that works?",
    plain: 'Join the waitlist from the date and time step of online booking and we will contact you if a spot opens up.',
    answer: (
      <>
        Join the waitlist from the date and time step when you <Link href="/book" className="text-accent underline">book online</Link>,
        and we&apos;ll contact you if a spot opens up.
      </>
    ),
  },
  {
    question: 'Do you offer financing?',
    plain: 'Yes, financing is available through Beautifi.',
    answer: (
      <>
        Yes. Financing is available through{' '}
        <a
          href="https://www.beautifi.com/doctors/phace-medical-aesthetics-and-skincare/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          Beautifi
        </a>
        . Online store orders can also be paid with Afterpay at checkout.
      </>
    ),
  },
  {
    question: 'Do you sell gift cards?',
    plain: 'Yes, Phace gift cards can be purchased online.',
    answer: (
      <>
        Yes. <a href="https://squareup.com/gift/MLQZQRE5MYB56/order" target="_blank" rel="noopener noreferrer" className="text-accent underline">Buy a Phace gift card online</a>.
      </>
    ),
  },
  {
    question: 'Can I direct bill IV therapy to my benefits?',
    plain: 'Yes, IV therapy is direct billed to your benefits. A consultation is required first.',
    answer: (
      <>
        Yes, we direct bill IV therapy to your benefits. A consultation is required first to make sure IV or iron
        therapy is right for you. <Link href="/treatments/iv-therapy" className="text-accent underline">Learn about IV therapy</Link>.
      </>
    ),
  },
  {
    question: 'How does shipping work for online orders?',
    plain: 'Shipping is a flat $25, or choose free local pickup at the clinic. You will receive tracking details by email or SMS once your order ships.',
    answer: (
      <>
        Shipping is a flat $25, or choose free local pickup at the clinic during checkout. Once your order ships
        you&apos;ll get tracking details by email or SMS.{' '}
        <Link href="/shipping-policy" className="text-accent underline">Shipping policy</Link>.
      </>
    ),
  },
  {
    question: 'Where are you located, and when are you open?',
    plain: `We are at ${CLINIC_ADDRESS_ONE_LINE}. ${OPENING_HOURS.map(formatOpeningHours).join('. ')}.`,
    answer: (
      <>
        We&apos;re at {CLINIC_ADDRESS_ONE_LINE} in Yarrow.{' '}
        <a href={CLINIC.directionsUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">Get directions</a>.
        <ul className="mt-3 space-y-1">
          {OPENING_HOURS.map((hours) => (
            <li key={hours.day}>{formatOpeningHours(hours)}</li>
          ))}
        </ul>
      </>
    ),
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.plain },
  })),
}

export default function FaqPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#FFFBF0]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-light text-[#4A5568] mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600 mb-10">
          Can&apos;t find your answer? <Link href="/contact" className="text-accent underline">Contact us</Link> or call{' '}
          <a href={CLINIC.phoneHref} className="text-accent underline">{CLINIC.phoneDisplay}</a>.
        </p>

        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group bg-white rounded-lg shadow-sm p-5">
              <summary className="flex justify-between items-center gap-4 cursor-pointer list-none text-lg font-medium text-gray-900">
                {faq.question}
                <span className="text-accent text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <div className="mt-3 text-gray-700 leading-relaxed">{faq.answer}</div>
            </details>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/book" className="inline-block bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors">
            Book an Appointment
          </Link>
        </div>
      </div>
    </div>
  )
}
