import { Hero } from '@/components/home/Hero'
import { Services } from '@/components/home/Services'
import { ClientStories } from '@/components/home/ClientStories'
import { Awards } from '@/components/home/Awards'
import { BrandPartners } from '@/components/home/BrandPartners'
import { Location } from '@/components/home/Location'
import { BackToTop } from '@/components/BackToTop'

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <ClientStories />
      <Awards />
      <BrandPartners />
      <Location />
      <BackToTop />
    </>
  )
}
