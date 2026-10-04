import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Shipping and local pickup information for orders from the Phace online store.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
