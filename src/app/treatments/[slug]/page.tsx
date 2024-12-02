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

export default function TreatmentPage({ params }: Props) {
  const treatment = treatments.find((t) => t.slug === params.slug)

  if (!treatment) {
    notFound()
  }

  const treatmentNameUpper = treatment.name.toUpperCase()

  return (
    <main className="min-h-screen bg-[#F8E7E1]">
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
            <h1 className="text-8xl font-light text-white mb-8">
              {treatmentNameUpper}
            </h1>
            <div className="absolute bottom-12 right-12">
              <Link
                href="/book"
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
          <h2 className="text-6xl font-light text-[#E4B4A6] text-center mb-16">
            WHAT IS<br />{treatmentNameUpper}?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
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
          <h2 className="text-6xl font-light text-[#E4B4A6] mb-16">
            HOW {treatmentNameUpper} WORKS
          </h2>
          <div className="grid grid-cols-2 gap-12">
            <div>
              {treatment.longDescription?.split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-[#4A5568] mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="relative aspect-w-4 aspect-h-3">
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

      {/* Book Appointment Section */}
      <section className="py-20 bg-[#F8E7E1] text-center">
        <Link
          href="/book"
          className="text-2xl text-[#4A5568] hover:text-[#2D3748] transition-colors"
        >
          Book Appointment ↓
        </Link>
      </section>
    </main>
  )
}
