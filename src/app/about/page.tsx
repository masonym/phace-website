import { OurClinic } from '@/components/about/OurClinic'
import { WhatSetsUsApart } from '@/components/about/WhatSetsUsApart'
import { MeetOurTeam } from '@/components/about/MeetOurTeam'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Meet the team at Phace Medical Aesthetics in Yarrow, Chilliwack: experienced aestheticians, nurses and a naturopathic physician offering personalized skin and wellness care.',
}

export default function AboutPage() {
  return (
    <>
      <OurClinic />
      <WhatSetsUsApart />
      <MeetOurTeam />
    </>
  )
}
