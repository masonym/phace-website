import { TreatmentsHero } from '@/components/treatments/TreatmentsHero'
import { InnovativeSolutions } from '@/components/treatments/InnovativeSolutions'
import { BookTreatment } from '@/components/treatments/BookTreatment'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Signature Treatments',
  description: 'Laser, microneedling, Tixel, chemical peels and advanced skin treatments at Phace Medical Aesthetics in Chilliwack, BC.',
}

export default function TreatmentsPage() {
  return (
    <>
      <TreatmentsHero />
      <InnovativeSolutions />
      <BookTreatment />
    </>
  )
}
