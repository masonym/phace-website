/**
 * @jest-environment node
 */
import { GET } from '../admin/promotions/route'
import { requireAdmin } from '@/lib/auth/requireAdmin'

jest.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/services/orderDiscountService', () => ({
  getB2G1CategoryId: () => process.env.B2G1_PROMO_CATEGORY_ID || process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID || '',
}))

const request = () => new Request('http://localhost:3000/api/admin/promotions')

describe('/api/admin/promotions', () => {
  beforeEach(() => {
    ;(requireAdmin as jest.Mock).mockResolvedValue(null)
    delete process.env.B2G1_PROMO_CATEGORY_ID
    delete process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID
  })

  it('reports the promotion as off when no category is set', async () => {
    expect(await (await GET(request())).json()).toEqual({ b2g1: { categoryId: null, previewMismatch: false } })
  })

  it('flags when checkout and the cart preview use different categories', async () => {
    process.env.B2G1_PROMO_CATEGORY_ID = 'SERVER'
    process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID = 'PUBLIC'
    expect(await (await GET(request())).json()).toEqual({ b2g1: { categoryId: 'SERVER', previewMismatch: true } })
  })

  it('is consistent when only the public variable is set', async () => {
    process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID = 'PUBLIC'
    expect(await (await GET(request())).json()).toEqual({ b2g1: { categoryId: 'PUBLIC', previewMismatch: false } })
  })

  it('rejects non-admins', async () => {
    const denied = new Response(null, { status: 401 })
    ;(requireAdmin as jest.Mock).mockResolvedValue(denied)
    expect(await GET(request())).toBe(denied)
  })
})
