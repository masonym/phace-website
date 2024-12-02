import Image from 'next/image'
import Link from 'next/link'
import { treatments } from '@/data/treatments'

export function InnovativeSolutions() {
  return (
    <section className="py-20 bg-[#F8E7E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-6xl font-light text-[#E4B4A6] mb-16">
          INNOVATIVE SOLUTIONS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {treatments.map((treatment) => (
            <div key={treatment.id} className="bg-white rounded-3xl overflow-hidden shadow-lg">
              <div className="aspect-w-16 aspect-h-9 relative">
                <Image
                  src={treatment.imageCard}
                  alt={treatment.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-light text-[#4A5568] mb-4">
                  {treatment.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {treatment.description}
                </p>
                <Link
                  href={`/treatments/${treatment.slug}`}
                  className="text-[#4A5568] hover:text-[#2D3748] transition-colors underline"
                >
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
