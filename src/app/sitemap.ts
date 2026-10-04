import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config/site'
import { treatments } from '@/data/treatments'
import { ProductService } from '@/lib/services/productService'
import { productPath } from '@/lib/utils/productUrl'

// Rebuild daily so new products show up
export const revalidate = 86400

async function productEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const products = await ProductService.listProducts()
    return products
      .filter((product) => product.type === 'ITEM')
      .map((product) => ({
        url: `${SITE_URL}${productPath(product.id, product.type === 'ITEM' ? product.itemData?.name : undefined)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
  } catch (error) {
    // Square unavailable: still publish the rest of the sitemap
    console.error('Sitemap: could not load products', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { path: '', priority: 1 },
    { path: '/book', priority: 0.9 },
    { path: '/treatments', priority: 0.9 },
    { path: '/treatments/injectables', priority: 0.8 },
    { path: '/treatments/iv-therapy', priority: 0.8 },
    { path: '/treatments/brows-lashes-nails', priority: 0.8 },
    { path: '/about', priority: 0.7 },
    { path: '/contact', priority: 0.7 },
    { path: '/faq', priority: 0.6 },
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
    ...(await productEntries()),
  ]
}
