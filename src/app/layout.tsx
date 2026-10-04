import './globals.css'
import type { Metadata } from 'next'
import { Spinnaker } from 'next/font/google'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import FloatingButtons from '@/components/shared/FloatingButtons'
import { CartProvider } from '@/components/providers/CartProvider';
import { AuthProvider } from '@/hooks/useAuth'
import { Toaster } from 'react-hot-toast';
import FirstVisitGiftCard from '@/components/promotions/FirstVisitGiftCard';
import FirstFivePresale from '@/components/promotions/FirstFivePresale';
import { SITE_URL } from '@/lib/config/site';
import { CLINIC, OPENING_HOURS } from '@/lib/config/clinicInfo';

// Brand font, self-hosted by Next at build time
const spinnaker = Spinnaker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-spinnaker',
})

const SITE_DESCRIPTION = 'Enhance your natural beauty with our expert medical spa treatments in Chilliwack. Offering facials, skin treatments, injectables, and more.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Phace - Medical Spa in Chilliwack',
    template: '%s | Phace Medical Aesthetics',
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Phace Medical Aesthetics',
    locale: 'en_CA',
    images: ['/images/hero-image.webp'],
  },
}

// Lets search engines show hours, address and phone in local results
const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: CLINIC.name,
  url: SITE_URL,
  image: `${SITE_URL}/images/hero-image.webp`,
  logo: `${SITE_URL}/images/logo.webp`,
  telephone: CLINIC.phoneE164,
  email: CLINIC.email,
  description: SITE_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    streetAddress: CLINIC.street,
    addressLocality: CLINIC.city,
    addressRegion: CLINIC.province,
    postalCode: CLINIC.postalCode,
    addressCountry: CLINIC.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: CLINIC.geo.lat,
    longitude: CLINIC.geo.lng,
  },
  openingHoursSpecification: OPENING_HOURS
    .filter((hours) => hours.opens && hours.closes)
    .map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${hours.day}`,
      opens: hours.opens,
      closes: hours.closes,
    })),
  sameAs: ['https://instagram.com/phace.ca'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={spinnaker.variable}>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17962992563"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17962992563');
            `,
          }}
        />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Phace" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
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
        {/* <FirstVisitGiftCard /> */}
        <FirstFivePresale />
      </body>
    </html>
  )
}
