import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config/site'
import { treatments } from '@/data/treatments'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: '', priority: 1 },
    { path: '/book', priority: 0.9 },
    { path: '/treatments', priority: 0.9 },
    { path: '/treatments/injectables', priority: 0.8 },
    { path: '/treatments/iv-therapy', priority: 0.8 },
    { path: '/treatments/brows-lashes-nails', priority: 0.8 },
    { path: '/about', priority: 0.7 },
    { path: '/contact', priority: 0.7 },
    { path: '/store', priority: 0.7 },
    { path: '/booking-policy', priority: 0.3 },
    { path: '/shipping-policy', priority: 0.3 },
  ]

  return [
    ...staticPages.map(({ path, priority }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'monthly' as const,
      priority,
    })),
    ...treatments.map((treatment) => ({
      url: `${SITE_URL}/treatments/${treatment.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
