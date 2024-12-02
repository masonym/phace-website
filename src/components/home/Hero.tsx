import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Full-screen background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-image.webp"
            alt="Natural Beauty Enhancement"
            fill
            className="object-cover object-[75%_25%] md:object-center"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-wider">
            ENHANCE YOUR<br />NATURAL BEAUTY
          </h1>
          <p className="text-xl md:text-2xl mb-12 font-light">
            Aesthetics and wellness treatments for every body
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/book"
              className="bg-white text-accent px-8 py-4 rounded-full hover:bg-accent hover:text-white transition-colors text-lg font-medium"
            >
              Book a Treatment
            </Link>
            <Link
              href="/treatments"
              className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-accent transition-colors text-lg font-medium"
            >
              Finance with Beautifi
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        {/* Image Side */}
        <div className="relative h-[600px] lg:min-h-[650px]">
          <Image
            src="/images/woman-portrait.webp"
            alt="Beautiful woman with grey hair smiling"
            fill
            className="object-cover"
          />
        </div>

        {/* Text Side */}
        <div className="bg-[#F2E4E6] p-12 lg:p-20 flex items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl text-[#4A4A4A] font-light leading-tight mb-8">
              Experience the perfect blend of beauty and wellbeing. Discover our expertly curated treatments for real, remarkable results.
            </h2>
            <Link
              href="/book"
              className="inline-flex items-center text-lg text-[#4A4A4A] hover:text-black transition-colors"
            >
              Book Now
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
