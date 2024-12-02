import Link from 'next/link'

export function BookTreatment() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-light text-[#4A5568] mb-8">
          BOOK A TREATMENT
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Ready to start your journey to healthier, more radiant skin? Book your treatment today 
          and let our expert team help you achieve your skincare goals.
        </p>
        <Link
          href="/book"
          className="inline-block bg-[#E4B4A6] text-white px-8 py-4 rounded-full text-lg hover:bg-[#d19586] transition-colors"
        >
          Schedule Your Appointment
        </Link>
      </div>
    </section>
  )
}
