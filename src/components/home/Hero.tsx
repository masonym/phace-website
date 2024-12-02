import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="min-h-screen pt-20 flex items-center bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="hero-text mb-6">
              ENHANCE YOUR NATURAL BEAUTY
            </h1>
            <p className="text-lg mb-8">
              Aesthetics and wellness treatments for every body
            </p>
            <div className="flex space-x-4">
              <Link
                href="/book"
                className="bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-colors"
              >
                Book a Treatment
              </Link>
              <Link
                href="/treatments"
                className="border border-accent text-accent px-6 py-3 rounded-full hover:bg-accent/10 transition-colors"
              >
                Finance with Beautifi
              </Link>
            </div>
          </div>
          <div className="relative aspect-square">
            <Image
              src="/images/hero-image.jpg"
              alt="Natural Beauty Enhancement"
              fill
              className="object-cover rounded-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
