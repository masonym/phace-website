import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { treatments } from "@/data/treatments"

interface Props {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return treatments.map((treatment) => ({
    slug: treatment.slug,
  }))
}

export function generateMetadata({ params }: Props): Metadata {
  const treatment = treatments.find((t) => t.slug === params.slug)
  if (!treatment) return {}
  return {
    title: `${treatment.name} in Chilliwack`,
    description: treatment.description.length > 160
      ? `${treatment.description.slice(0, 157).trimEnd()}...`
      : treatment.description,
  }
}

export default function TreatmentPage({ params }: Props) {
  const treatment = treatments.find((t) => t.slug === params.slug)

  if (!treatment) {
    notFound()
  }

  const displayName = treatment.shortName ?? treatment.name
  const treatmentNameUpper = displayName.toUpperCase()
  // Opens booking on the treatment's Square category (by ID, else by name keyword), otherwise the category list
  const bookHref = treatment.bookingCategoryId
    ? `/book?step=service&categoryId=${encodeURIComponent(treatment.bookingCategoryId)}`
    : treatment.bookingCategory
      ? `/book?category=${encodeURIComponent(treatment.bookingCategory)}`
      : "/book"

  return (
    <div className="min-h-screen bg-[#F8E7E1]">
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <Image
            src={treatment.imageMain}
            alt={treatment.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
            <h1 className="text-center text-4xl md:text-8xl font-light text-white mb-8">
              {treatmentNameUpper}
            </h1>
            {treatment.subtitle && (
              <p className="text-center text-xl md:text-3xl font-light text-white mb-4">
                {treatment.subtitle}
              </p>
            )}
            {treatment.tagline && (
              <p className="text-center text-lg md:text-xl text-white/90">
                {treatment.tagline}
              </p>
            )}
            <div className="absolute bottom-12 right-12">
              <Link
                href={bookHref}
                className="bg-[#FDF3E7] text-[#4A5568] px-8 py-4 rounded-full text-lg hover:bg-[#F8E7E1] transition-colors"
              >
                Book a Treatment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-2 text-[#4A5568]">
          <Link href="/" className="hover:text-[#2D3748]">HOME</Link>
          <span>/</span>
          <Link href="/treatments" className="hover:text-[#2D3748]">Signature Treatments</Link>
          <span>/</span>
          <span>{treatment.name}</span>
        </div>
      </div> */}

      {/* What Is Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-6xl font-light text-heading text-center mb-16">
            WHAT IS<br />{treatmentNameUpper}?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {treatment.cards?.map((card, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-3xl shadow-lg"
              >
                <h3 className="text-xl font-medium text-[#4A5568] mb-4">
                  {card.title}
                </h3>
                <p className="text-[#4A5568]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-6xl font-light text-heading mb-16">
            HOW {treatmentNameUpper} WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              {treatment.longDescription?.split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-[#4A5568] mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="relative h-[300px] md:h-[400px]">
              <Image
                src={treatment.imageSub}
                alt={`How ${treatment.name} works`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {(treatment.benefits?.length || treatment.duration) && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-6xl font-light text-heading mb-12">
              {treatment.benefitsTitle ?? "BENEFITS"}
            </h2>
            {treatment.benefits && treatment.benefits.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg text-[#4A5568]">
                {treatment.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="text-heading-strong" aria-hidden="true">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}
            {treatment.duration && (
              <p className="mt-8 text-[#4A5568]">
                <span className="font-medium">Typical treatment time:</span> {treatment.duration}
              </p>
            )}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {treatment.faqs && treatment.faqs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-6xl font-light text-heading mb-12">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <div className="divide-y divide-[#4A5568]/20 border-y border-[#4A5568]/20">
              {treatment.faqs.map((faq) => (
                <details key={faq.question} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl text-[#4A5568] [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <span className="text-2xl font-light transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <div className="mt-4 space-y-4 text-[#4A5568]">
                    {faq.answer.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Book Appointment Section */}
      <section className={`py-20 text-center ${treatment.faqs?.length ? "" : "bg-white"}`}>
        <h2 className="text-3xl font-light text-[#4A5568] mb-6">Ready to book {displayName}?</h2>
        <Link
          href={bookHref}
          className="inline-block bg-accent text-white px-8 py-4 rounded-full text-lg hover:bg-accent/90 transition-colors"
        >
          Book an Appointment
        </Link>
      </section>
    </div>
  )
}
