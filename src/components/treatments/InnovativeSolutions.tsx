import Image from 'next/image'
import Link from 'next/link'
import { treatments } from '@/data/treatments'

// Lays cards out three per row on desktop (a 6-column grid with each card
// spanning 2). Leftover cards in the last row widen so the row is filled:
// two leftovers split it in half, a single leftover sits centred.
function desktopSpan(index: number, total: number) {
  const remainder = total % 3
  const inLastRow = remainder > 0 && index >= total - remainder
  if (inLastRow && remainder === 2) return 'lg:col-span-3'
  if (inLastRow && remainder === 1) return 'lg:col-span-2 lg:col-start-3'
  return 'lg:col-span-2'
}

// On tablet (two columns), a lone last card is centred instead of hanging left.
function tabletSpan(index: number, total: number) {
  const isOrphan = total % 2 === 1 && index === total - 1
  return isOrphan
    ? 'md:col-span-2 md:w-[calc(50%-1.25rem)] md:justify-self-center lg:w-auto lg:justify-self-stretch'
    : ''
}

export function InnovativeSolutions() {
  return (
    <section className="py-20 bg-[#F8E7E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-6xl font-light text-heading mb-16">
          INNOVATIVE SOLUTIONS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {treatments.map((treatment, index) => (
            <Link
              key={treatment.id}
              href={`/treatments/${treatment.slug}`}
              className={`group flex flex-col bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${tabletSpan(index, treatments.length)} ${desktopSpan(index, treatments.length)}`}
            >
              <div className="h-[260px] relative overflow-hidden">
                <Image
                  src={treatment.imageCard}
                  alt={treatment.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-8">
                <h3 className="text-2xl font-light text-[#4A5568] mb-4 group-hover:text-heading-strong transition-colors">
                  {treatment.name}
                </h3>
                <p className="text-gray-600 mb-6 line-clamp-4">
                  {treatment.description}
                </p>
                <span className="mt-auto inline-block text-[#4A5568] group-hover:text-heading-strong transition-colors">
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
