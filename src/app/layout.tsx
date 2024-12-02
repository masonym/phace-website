import './globals.css'
import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import FloatingButtons from '@/components/shared/FloatingButtons'
import { CartProvider } from '@/hooks/useCart'

export const metadata: Metadata = {
  title: 'Phace - Medical Spa in Chilliwack',
  description: 'Enhance your natural beauty with our expert medical spa treatments in Chilliwack. Offering facials, skin treatments, injectables, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <Navigation />
          <main className="flex-grow">{children}</main>
          {/* <FloatingButtons /> */}
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
