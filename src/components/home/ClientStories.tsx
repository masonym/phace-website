import React from 'react'
import Image from 'next/image'

type Story = {
  quote: string;
  image: string;
  title: string;
  name: string;
}

const stories: Story[] = [
  {
    quote: "The results were remarkable",
    image: "/images/client1.webp",
    title: "What truly sets Phace apart is the advanced technology they use for laser hair removal. Not only was the procedure virtually painless, but the results were remarkable. After just a few sessions, I noticed a significant reduction in hair growth, and now, I can confidently say goodbye to the constant hassle of shaving and waxing.",
    name: "Leah",
  },
  {
    quote: "A personalized approach",
    image: "/images/client2.webp",
    title: "What makes Phace facials unique is their personalized approach. The knowledgeable aestheticians took the time to assess my skin's specific needs and tailor each treatment accordingly. Not only did they target my existing acne, but they also provided valuable skincare advice to prevent future breakouts",
    name: "Jen",
  },
  {
    quote: "Professional expertise",
    image: "/images/client3.webp",
    title: "From the moment I walked through their doors, I was impressed by the professionalism and expertise of the staff. They took the time to listen to my concerns and goals, providing me with a customized treatment plan that targeted my specific aging concerns.",
    name: "Ashley",
  }
]

export function ClientStories() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title text-center">OUR CLIENTS STORIES</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {stories.map((story, index) => (
            <div key={index} className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6 oval-image">
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  className="object-cover"
                />
              </div>
              <blockquote className="text-lg font-medium mb-4">
                "{story.quote}"
              </blockquote>
              <p className="text-text/80">{story.title}</p>
              <p className="mt-2 font-semibold">{story.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
