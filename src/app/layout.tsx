import './globals.css'
import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import FloatingButtons from '@/components/shared/FloatingButtons'
import { CartProvider } from '@/components/providers/CartProvider';
import { AuthProvider } from '@/hooks/useAuth'
import { Toaster } from 'react-hot-toast';
import FirstVisitGiftCard from '@/components/promotions/FirstVisitGiftCard';

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
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Phace" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <div className="relative flex flex-col min-h-screen overflow-x-hidden">
              <Navigation />
              <main className="flex-grow relative">
                {children}
              </main>
              {/* <FloatingButtons /> */}
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
        <Toaster position="bottom-right" />
        <FirstVisitGiftCard />
      </body>
    </html>
  )
}
