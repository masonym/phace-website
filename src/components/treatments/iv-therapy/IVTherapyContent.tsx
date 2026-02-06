import Image from "next/image";
import Link from "next/link";

const benefits = [
  {
    title: "Efficient Hydration Support",
    description: "Delivers fluids and electrolytes directly into the bloodstream for rapid hydration when oral intake may not be sufficient."
  },
  {
    title: "Energy and Fatigue Support",
    description: "Provides key vitamins and minerals that can support energy levels during periods of physical or mental demand."
  },
  {
    title: "Immune System Support",
    description: "Supplies nutrients commonly used to support immune function and overall resilience."
  },
  {
    title: "Skin Health Support",
    description: "Proper hydration and nutrient availability can support skin function and overall skin vitality."
  },
  {
    title: "Recovery Support",
    description: "May assist with recovery following exercise, illness, or periods of physical stress."
  },
  {
    title: "Direct Nutrient Delivery",
    description: "Bypasses the digestive system, which can be helpful when absorption or tolerance is a concern."
  },
  {
    title: "Individualized Protocols",
    description: "Treatments are selected and adjusted based on individual needs, goals, and medical screening."
  },
  {
    title: "Mental Clarity and Stress Support",
    description: "Hydration and nutrient balance can play a role in supporting focus and overall well-being."
  },
  {
    title: "Performance Support",
    description: "Often used to support physical performance and recovery in active individuals."
  },
  {
    title: "Metabolic and Cellular Support",
    description: "Supports the body's natural processes involved in cellular function and metabolic balance."
  }
];

const ivSupports = [
  "Hydration and fluid balance",
  "Recovery from physical exertion or illness",
  "Energy and resilience during demanding periods",
  "Overall wellness support"
];

export default function IVTherapyContent() {
  return (
    <div className="bg-[#FFF5E6]">
      {/* overview section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl text-center mb-16 font-light text-[#4A4A4A]">
            IV Therapy
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-[#4A4A4A] leading-relaxed">
              <p>
                IV therapy at Phace Medical Aesthetics &amp; Wellness is a medically guided approach to hydration and nutrient support designed to help the body function at its best. Our IV treatments deliver fluids, vitamins, and minerals directly into the bloodstream, which can be beneficial during periods of increased physical demand, fatigue, recovery, or when oral intake is not ideal.
              </p>
              <p>
                Each IV therapy protocol is selected with intention and aligned with your individual needs and goals. Whether you are looking to support hydration, immune function, recovery, or overall wellness, our team takes a thoughtful, safety-first approach to ensure care is appropriate and effective.
              </p>
              <p>
                IV therapy at Phace is not about quick fixes or trends. It is about supporting your body with evidence-informed care and medical oversight. Book a consultation to determine whether IV therapy is a good fit for you and to create a plan that supports your overall health and well-being. Our IV therapy program currently includes iron infusions, IV therapy infusions and intramuscular injections.
              </p>
            </div>
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto lg:max-w-none rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/iv-therapy2.webp"
                alt="IV therapy treatment"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* benefits section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl text-center mb-16 font-light text-[#4A4A4A]">
            IV Therapy Benefits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-[#FFF5E6] p-8 rounded-3xl shadow-lg"
              >
                <h3 className="text-xl font-medium text-[#4A4A4A] mb-3">
                  {benefit.title}
                </h3>
                <p className="text-[#4A4A4A] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* image break */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/iv-therapy3.webp"
                alt="IV therapy at Phace"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/iv-therapy4.webp"
                alt="IV therapy wellness support"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* how it works section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl text-center mb-16 font-light text-[#4A4A4A]">
            How Does IV Therapy Work?
          </h2>

          <div className="max-w-4xl mx-auto space-y-6 text-[#4A4A4A] leading-relaxed">
            <p>
              IV therapy delivers fluids and selected vitamins or minerals directly into the bloodstream, allowing for immediate availability without relying on digestion or absorption through the gastrointestinal tract. This method can be useful when hydration or nutrient support is needed efficiently, or when oral intake is not ideal.
            </p>
            <p>
              IV therapy is often used to support the body during periods of increased physical or mental demand, such as fatigue, dehydration, recovery from illness or exercise, travel-related depletion, or times of elevated stress. It is not intended to diagnose, treat, or cure medical conditions, but rather to provide supportive care within an appropriate and medically guided scope.
            </p>
            <p>
              Because IV therapy bypasses the digestive system, nutrients are delivered directly to circulation, which may be beneficial for individuals seeking hydration support, recovery assistance, or overall wellness support. Treatments are selected based on individual health history, goals, and screening to ensure they are appropriate and safe.
            </p>

            <div className="mt-8">
              <h3 className="text-2xl font-light text-[#4A4A4A] mb-6">
                IV therapy at Phace is designed to support:
              </h3>
              <ul className="space-y-3">
                {ivSupports.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[#E4B4A6] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* direct billing note + booking CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-[#4A4A4A] mb-4 font-medium">
            A consultation is required to determine whether IV and iron therapy is suitable for you and to ensure care is aligned with your individual needs.
          </p>
          <p className="text-lg text-[#4A4A4A] mb-4 font-medium">
            We direct bill to your benefits.
          </p>
          <Link
            href="https://drjaninemackenzie.janeapp.com/?utm_source=ig&utm_medium=social&utm_content=link_in_bio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-slate-800 hover:bg-slate-700 hover:scale-105 rounded-md transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
          >
            Book a Consult Now →
          </Link>
        </div>
      </section>
    </div>
  );
}
