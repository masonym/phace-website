import { loadBindings } from 'next/dist/build/swc';
import Image from 'next/image'
import Link from 'next/link'

const services = [
  {
    title: 'Facials and Skin Treatments',
    description: "At Phace, we are passionate about promoting skin health through personalized care and advanced, results-driven techniques. Whether you're addressing acne, aging, or pigmentation issues, our dedicated team leverages cutting-edge technology and expertise to help you achieve your aesthetic goals.",
    // longDescription: `Experience transformative skincare with our comprehensive range of facial treatments. From deep cleansing and exfoliation to advanced anti-aging solutions, our expert estheticians customize each treatment to address your unique skin concerns.

    // Our treatments incorporate cutting-edge technology and medical-grade products to deliver visible results. Whether you're looking to address specific skin concerns or simply maintain healthy, glowing skin, we have the perfect treatment for you.`,
    image: '/images/facials.webp',
    // link: '/treatments/facials'
  },
  {
    title: 'Brows, Lashes, and Nails',
    description: "Indulge in the ultimate beauty experience at Phace with our exquisite brow, lash, and nail services, crafted to perfection by our skilled professionals. Using only the finest products and techniques, we ensure long-lasting, flawless results that elevate your look and leave you feeling confident and beautiful.",
    // longDescription: `Enhance your natural beauty with our specialized brow, lash, and nail services. Our skilled technicians offer a range of treatments including brow lamination, lash lifts, extensions, and professional nail care.

    // Each service is performed with precision and care, using premium products to ensure long-lasting results. From subtle enhancements to dramatic transformations, we'll help you achieve your desired look.`,
    image: '/images/brows-lashes-nails.webp',
    link: '/treatments/brows-lashes-nails'
  },
  {
    title: 'Injectables',
    description: "At Phace, our experienced Naturopath Physician specializes in neuromodulators and dermal fillers to provide top-notch injectable services. Focused on safety, precision, and patient satisfaction, our expert team customizes treatment plans to help you achieve natural-looking results, enhancing your beauty and boosting your confidence.",
    // longDescription: `Achieve natural-looking rejuvenation with our advanced injectable treatments. Our expert practitioners combine artistic vision with medical precision to enhance your features while maintaining a natural appearance.

    // We offer a comprehensive range of injectable treatments, including neuromodulators and dermal fillers, tailored to your unique facial anatomy and aesthetic goals.`,
    image: '/images/injectables.webp',
    link: '/treatments/injectables'
  },
  {
    title: "Laser Treatments",
    description: "Experience the transformative power of our advanced laser services at Phace, designed for exceptional results in hair removal, facial rejuvenation, acne, and rosacea treatments. Our experienced team customizes treatment plans to address your unique concerns, ensuring optimal results and a radiant, youthful complexion.",
    // longDescription: `Experience the transformative power of our advanced laser services at Phace, designed for exceptional results in hair removal, facial rejuvenation, acne, and rosacea treatments. Our experienced team customizes treatment plans to address your unique concerns, ensuring optimal results and a radiant, youthful complexion.`,

    image: '/images/laser-treatments.webp',
    // link: '/treatments/laser',
  },
  {
    title: 'Paramedical Scar Revision & Tattooing',
    description: "At Phace, we specialize in paramedical scar revision and paramedical tattoo services to help you achieve smooth, flawless skin. Our expert technicians use advanced techniques for scar revision and tattooing, offering personalized treatments that restore confidence and provide natural-looking results.",
    // longDescription: `Our paramedical scar revision and tattooing services offer advanced solutions for various skin concerns. Using state-of-the-art techniques and equipment, we help minimize the appearance of scars and restore natural-looking skin texture.

    // Our specialized treatments can address surgical scars, stretch marks, and other skin irregularities, helping you regain confidence in your appearance.`,
    image: '/images/scar-revision.webp',
    // link: '/treatments/scar-revision'
  }
]

export function Services() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title text-center mb-12">WHAT WE OFFER</h2>
        <div className="grid grid-cols-1 gap-12">
          {services.map((service) => (
            <div key={service.title} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative h-[300px] md:h-full min-h-[300px] order-1">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content Section */}
                <div className="p-8 flex flex-col order-2">
                  <h3 className="text-2xl md:text-3xl font-light text-slate-800 mb-4">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {service.description}
                  </p>
                  {/* <div className="mt-2 space-y-4 text-slate-600 flex-grow">
                    {service.longDescription.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div> */}
                  
                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    {service.link && <Link 
                      href={service.link}
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md transition duration-150 ease-in-out"
                    >
                      Learn More →
                    </Link>}
                    <Link 
                      href="/book"
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-slate-800 bg-transparent border-2 border-slate-800 hover:bg-slate-50 rounded-md transition duration-150 ease-in-out"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
