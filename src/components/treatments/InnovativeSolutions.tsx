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
            <Link 
              key={treatment.id} 
              href={`/treatments/${treatment.slug}`}
              className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-[300px] relative">
                <Image
                  src={treatment.imageCard}
                  alt={treatment.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-light text-[#4A5568] mb-4 group-hover:text-[#E4B4A6] transition-colors">
                  {treatment.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {treatment.description}
                </p>
                <span
                  className="inline-block text-[#4A5568] group-hover:text-[#E4B4A6] transition-colors"
                >
                  Learn More →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
