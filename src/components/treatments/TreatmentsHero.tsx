import Image from 'next/image';

export function TreatmentsHero() {
  return (
    <section className="min-h-[70vh] pt-20 bg-[#F8E7E1] flex items-center relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
        <div className="max-w-5xl lg:w-1/2">
          <h1 className="text-6xl font-light text-[#E4B4A6] mb-8">
            SIGNATURE<br />
            TREATMENTS
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Discover the power of our signature treatments at Phace, designed to rejuvenate and transform your skin.
          </p>
          <p className="text-xl text-gray-600 mb-6">
            Our innovative services include the cutting-edge Sharplight Laser for targeted skin improvements and hair removal, 
            Tixel skin resurfacing treatments, Bela MD+ Advanced Skin Health for comprehensive skincare, Dermapen Dp4 for 
            advanced microneedling, and AlumierMD Chemical Peels to address various skin concerns.
          </p>
          <p className="text-xl text-gray-600">
            Whether you're seeking to diminish wrinkles, reduce acne scars, improve skin tone, or achieve a radiant 
            complexion, our expert team is dedicated to delivering exceptional results tailored to your unique needs.
          </p>
          <p className="text-xl text-gray-600 mt-6">
            Elevate your skincare journey with our signature treatments and experience the ultimate in skin rejuvenation and wellness.
          </p>
        </div>
        <div className="lg:w-1/2 relative h-[600px] w-full rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/images/treatments/treatments-hero.webp"
            alt="Phace Signature Treatments"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
