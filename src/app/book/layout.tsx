import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: 'Book facials, laser, injectables, IV therapy, brows, lashes and nails online at Phace Medical Aesthetics in Chilliwack, BC.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
