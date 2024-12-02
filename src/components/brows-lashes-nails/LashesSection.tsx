import { lashServices } from "@/data/brows-lashes-nails";

export default function LashesSection() {
  return (
    <section className="py-20 bg-beige-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl text-center font-light text-slate-800 mb-16">
          Lashes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {lashServices.map((service, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-8">
                <h3 className="text-2xl font-light text-slate-800 mb-4">
                  {service.title}
                </h3>
                <div className="text-slate-600 space-y-4">
                  <h4 className="font-medium">What is {service.title.toLowerCase()}?</h4>
                  <p>{service.description}</p>
                  {service.process && (
                    <>
                      <h4 className="font-medium">The Process</h4>
                      <p>{service.process}</p>
                    </>
                  )}
                  {service.benefits && (
                    <>
                      <h4 className="font-medium">Benefits</h4>
                      <p>{service.benefits}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
