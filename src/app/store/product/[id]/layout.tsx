import type { Metadata } from 'next'
import { ProductService } from '@/lib/services/productService'
import { productIdFromParam, productPath } from '@/lib/utils/productUrl'

// The product page itself loads in the browser, so give search engines and link previews
// a real title and description from the server
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const id = productIdFromParam(params.id)
    const product = await ProductService.getProductById(id)
    const name = product.itemData?.name
    if (!name) return {}
    const raw = (product.itemData as any)?.descriptionPlaintext || product.itemData?.description || ''
    const text = String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const image = (product.itemData as any)?.ecom_image_uris?.[0]
    return {
      title: name,
      description: text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text || `Shop ${name} at Phace.`,
      alternates: { canonical: productPath(id, name) },
      openGraph: image ? { images: [image] } : undefined,
    }
  } catch {
    return { title: 'Product' }
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
