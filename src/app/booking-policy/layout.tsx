import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Booking Policy',
  description: 'Cancellation, late arrival and no-show policy for appointments at Phace Medical Aesthetics.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
