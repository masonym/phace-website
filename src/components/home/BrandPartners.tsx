import React from 'react'
import Image from 'next/image'
import styles from './BrandPartners.module.css'

const partners = [
  { name: "DMK", image: "/images/partners/dmk.webp" },
  { name: "Elle Hall", image: "/images/partners/elle-hall.webp" },
  { name: "Mifa", image: "/images/partners/mifa.webp" },
  { name: "Is Clinical", image: "/images/partners/is-clinical.webp" },
  { name: "Alumier", image: "/images/partners/alumiermd.webp" },
  { name: "Beautifi", image: "/images/partners/beautifi.webp" },
  { name: "Bion", image: "/images/partners/bion.webp" },
  { name: "Botanical Skincare", image: "/images/partners/botanical-skincare.webp" },
  { name: "Celluma", image: "/images/partners/celluma.webp" },
  { name: "Cheekbone", image: "/images/partners/cheekbone.webp" },
  { name: "Clarion", image: "/images/partners/clarion.webp" },
  { name: "ClearChoice", image: "/images/partners/clearchoice.webp" },
  { name: "ColorScience", image: "/images/partners/colorscience.webp" },
  { name: "DermaSpark", image: "/images/partners/dermaspark.webp" },
  { name: "DMK", image: "/images/partners/dmk.webp" },
  { name: "DP4", image: "/images/partners/dp.webp" },
  { name: "Freezpen", image: "/images/partners/freezpen.webp" },
  { name: "Jessica", image: "/images/partners/jessica.webp" },
  { name: "Pura", image: "/images/partners/pura.webp" },
  { name: "See You Sundae", image: "/images/partners/see-you-sundae.webp" },
  { name: "Sharplight", image: "/images/partners/sharplight.webp" },
  { name: "Tizo", image: "/images/partners/tizo.webp" },
  { name: "Zena", image: "/images/partners/zena.webp" },
]

export function BrandPartners() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="section-title text-center mb-12">Brand Partners</h2>
        
        <div className={styles.scrollContainer}>
          <div className={styles.scrollContent}>
            {/* Duplicate the partners array to create seamless scrolling */}
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className={styles.partnerImage}
              >
                <Image
                  src={partner.image}
                  alt={partner.name}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
