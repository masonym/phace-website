import React from 'react'
import Image from 'next/image'

const awards = [
  {
    title: "2024 Canadian Choice Award",
    subtitle: "Best Medical Spa",
    image: "/images/awards/canadian-choice-2024.webp"
  },
  {
    title: "2024 Winner",
    subtitle: "Chilliwack's Best Day Spa",
    image: "/images/awards/a-list-2024.webp"
  },
  {
    title: "2023 Community Votes Winner",
    subtitle: "Platinum, Gold, and Silver",
    image: "/images/awards/community-votes-2023.webp"
  }
]

export function Awards() {
  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl text-center mb-4">Chilliwack's Favourite Med Spa!</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
          {awards.map((award, index) => (
            <div key={index} className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <Image
                  src={award.image}
                  alt={award.title}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-lg font-medium text-accent mb-2">{award.title}</h3>
              <p className="text-text/80">{award.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
