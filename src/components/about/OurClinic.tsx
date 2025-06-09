import Image from 'next/image'
import Link from 'next/link'

export function OurClinic() {
  return (
    <section className="pt-12 md:pt-20 bg-[#F8E7E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 md:mb-8 text-[#E4B4A6]">OUR CLINIC</h1>
            <h2 className="text-2xl md:text-3xl font-light mb-6 md:mb-8 text-[#E4B4A6]">
              Embrace Your Natural Beauty:<br />
              Where Small-Town Warmth<br />
              Meets Big-City Results
            </h2>
            <Link
              href="/contact"
              className="text-[#E4B4A6] hover:text-[#d19586] transition-colors"
            >
              Book a complimentary consultation today →
            </Link>
          </div>
          <div className="relative mt-6 md:mt-0">
            <div className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-full mx-auto rounded-full overflow-hidden">
              <Image
                src="/images/phace-outside.webp"
                alt="Phace Medical Spa Exterior"
                width={800}
                height={600}
                className="object-contain w-full h-auto"
                priority
              />
            </div>
            <div className="text-center absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Link
                href="/book"
                className="bg-[#FFF3E3] text-black px-4 py-4 sm:px-6 md:px-8 sm:py-6 md:py-8 rounded-full hover:bg-[#FFE9CC] transition-colors text-sm sm:text-base"
              >
                Book a Treatment
              </Link>
              <Link
                href="https://www.beautifi.com/doctors/phace-medical-aesthetics-and-skincare/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#4A5568] text-white px-4 py-4 sm:px-6 md:px-8 sm:py-6 md:py-8 rounded-full hover:bg-[#2D3748] transition-colors text-sm sm:text-base"
              >
                Finance with Beautifi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
