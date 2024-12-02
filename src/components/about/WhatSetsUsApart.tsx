const features = [
  {
    number: '01',
    title: 'EXCEPTIONAL TEAM OF EXPERTS',
    description: 'At Phace, education, ethics, and professionalism are not just values – they’re the foundation of every treatment we provide.'
  },
  {
    number: '02',
    title: 'THE LATEST TREATMENT TECHNOLOGIES',
    description: 'At Phace, our cutting-edge treatments redefine beauty and rejuvenation, bringing innovation to your skincare journey.'
  },
  {
    number: '03',
    title: 'PROVEN RESULTS',
    description: 'At Phace, our treatments are more than promises – they’re proven pathways to visible results and radiant transformations.'
  }
]

export function WhatSetsUsApart() {
  return (
    <section className="py-20 bg-[#FDECC2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-6xl font-light text-[#E4B4A6] mb-8">
              WHAT<br />
              SETS US<br />
              APART?
            </h2>
          </div>
          <div className="space-y-12">
            {features.map((feature) => (
              <div key={feature.number} className="border-t border-[#E4B4A6] pt-8">
                <div className="text-sm text-[#E4B4A6] mb-2">{feature.number}</div>
                <h3 className="text-xl font-medium text-[#E4B4A6] mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
