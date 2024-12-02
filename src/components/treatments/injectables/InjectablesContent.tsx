import Image from "next/image";
import { injectableServices } from "@/data/injectables";

export default function InjectablesContent() {
  return (
    <section className="py-20 bg-[#FFF5E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl text-center mb-16 font-light text-[#4A4A4A]">
          Revitalize Your Skin with Expertly Administered Injectables
        </h2>
        
        <p className="text-lg md:text-xl text-center max-w-4xl mx-auto mb-20 text-[#4A4A4A]">
          At Phace, we understand the importance of feeling confident in your own skin. That is why we offer a variety of injectable treatments designed to help you achieve your aesthetic goals. Our highly trained and experienced staff use the most effective solutions, such as neuromodulator injections, dermal fillers, and platelet-rich plasma, to provide our clients with natural-looking results. Our goal is to enhance your natural beauty and boost your confidence.
        </p>

        <div className="space-y-24">
          {injectableServices.map((service, index) => (
            <div 
              key={service.title}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="relative h-[400px] lg:h-[500px]">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              <div className="space-y-8">
                <h3 className="text-3xl md:text-4xl font-light text-[#4A4A4A]">
                  {service.title}
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl md:text-2xl mb-4 font-medium text-[#4A4A4A]">
                      {service.whatIs.question}
                    </h4>
                    <div className="space-y-4">
                      {service.whatIs.content.map((paragraph, i) => (
                        <p key={i} className="text-[#4A4A4A] leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl md:text-2xl mb-4 font-medium text-[#4A4A4A]">
                      {service.howWorks.question}
                    </h4>
                    <div className="space-y-4">
                      {service.howWorks.content.map((paragraph, i) => (
                        <p key={i} className="text-[#4A4A4A] leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
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
