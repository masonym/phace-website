import Image from 'next/image'
import Link from 'next/link'

const team = [
  {
    name: 'Dawn Reynolds',
    title: 'Founder & Medical Aesthetician',
    image: '/images/team/dawn.webp',
    instagram: '@phace.ca',
    bio: [
      'Dawn Reynolds stands as the founder and sole proprietor of Phace Medical Aesthetics & Skincare, boasting nearly two decades of experience in the medical, health, and wellness sectors.',
      'As a Certified Medical Aesthetician, Dawn holds many esteemed certifications including in Paramedical Skin Revision, Acne, and Oncology Aesthetics.',
      'Her approach is characterized by an integrative, results-focused strategy towards skincare, complemented by a steadfast commitment to building trust, maintaining ethical standards, and upholding professionalism.',
      'By prioritizing enduring client relationships, continuous education, current certifications, and innovative techniques, Dawn is dedicated to helping her clients achieve and maintain their healthiest skin.'
    ]
  },
  {
    name: 'Dr. Janine MacKenzie',
    title: 'Naturopathic Doctor',
    image: '/images/team/janine.webp',
    bio: [
      'Dr. Janine MacKenzie is a dedicated Naturopathic Doctor with a passion for blending art and science in medical aesthetics.',
      'With a background in Biology, Psychology, and Neuroscience, she found her calling in Naturopathic Medicine. Dr. MacKenzie specializes in helping women enhance their natural beauty through subtle changes and preventive care.',
      'Her expertise in neuromodulators like Botox and dermal fillers, combined with her artistic sensibilities, ensures natural and harmonious results that boost her patients\' confidence and well-being.'
    ]
  },
  {
    name: 'Paz Sasyniuk',
    title: 'Certified Nail Technician',
    image: '/images/team/paz.webp',
    instagram: '@yarrownaillounge',
    bio: [
      'Paz, 7 years as Certified Nail Technician, finds joy in building personal connections through her profession. Her passion lies in uplifting women by offering pampering services and providing support and encouragement to empower others.'
    ]
  },
  {
    name: 'Anna Van Steenis',
    title: 'Medical Aesthetician',
    image: '/images/team/anna.webp',
    instagram: '@anna.skinrefined',
    bio: [
      'Anna is a Certified Medical Aesthetician, Laser Technician, and Paramedical Tattoo Artist. With over a decade of experience, she has a deep knowledge of how the skin functions.',
      'Specializing in all skin focused treatments and customized scar revisions, her positive attitude will guarantee that you always feel welcome and comfortable at Phace. Helping to bring out your confidence is what Anna loves most about her work.'
    ]
  },
  {
    name: 'Alyssa Maxwell',
    title: 'Certified Medical Aesthetician',
    image: '/images/team/alyssa.webp',
    instagram: '@_skinbyalyssa',
    bio: [
      'Alyssa is a Certified Medical Aesthetician with over a decade of experience. With a passion for skincare, she combines advanced, results-oriented treatments with a warm, personalized approach.',
      'She specializes in advanced custom facials, chemical peels, microneedling, Tixel, and waxing, combining precision with a calming and empathetic atmosphere. She understands that skin concerns can be deeply personal, which is why building long-term relationships with her clients, taking the time to educate and empower them, has always been important to her.',
      'Alyssa has recently returned to her hometown of Chilliwack and is eager to share her expertise with some new faces.'
    ]
  }
]

export function MeetOurTeam() {
  return (
    <section className="py-20 bg-[#F5F0EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-6xl font-light text-[#E4B4A6] mb-16">
          MEET OUR TEAM
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.name} className="space-y-6">
              <div className="aspect-w-3 aspect-h-4 rounded-[2rem] overflow-hidden bg-[#F8E7E1]">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={400}
                  height={400}
                  className="object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-light text-[#E4B4A6]">{member.name}</h3>
                <p className="text-gray-600 mb-4">{member.title}</p>
                <div className="space-y-4">
                  {member.bio.map((paragraph, index) => (
                    <p key={index} className="text-gray-600 text-sm">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {member.instagram && (
                  <Link
                    href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E4B4A6] hover:text-[#d19586] transition-colors text-sm inline-block mt-4"
                  >
                    {member.instagram}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
