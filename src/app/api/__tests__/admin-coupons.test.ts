/**
 * @jest-environment node
 */
import { PUT, DELETE } from '../admin/coupons/[code]/route'
import { SimpleCouponService } from '@/lib/services/simpleCouponService'
import { requireAdmin } from '@/lib/auth/requireAdmin'

jest.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/services/simpleCouponService', () => ({
  SimpleCouponService: { updateCoupon: jest.fn(), deleteCoupon: jest.fn() },
}))

const params = { params: { code: 'PALM' } }

function request(method: string, body?: unknown) {
  return new Request('http://localhost:3000/api/admin/coupons/PALM', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('/api/admin/coupons/[code]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue(null)
  })

  it('rejects non-admins', async () => {
    const denied = new Response(null, { status: 401 })
    ;(requireAdmin as jest.Mock).mockResolvedValue(denied)

    expect(await PUT(request('PUT', {}), params)).toBe(denied)
    expect(await DELETE(request('DELETE'), params)).toBe(denied)
    expect(SimpleCouponService.updateCoupon).not.toHaveBeenCalled()
    expect(SimpleCouponService.deleteCoupon).not.toHaveBeenCalled()
  })

  it('saves the fields and clears optional ones that were left out', async () => {
    ;(SimpleCouponService.updateCoupon as jest.Mock).mockResolvedValue(true)

    const response = await PUT(request('PUT', {
      name: 'Palm Springs', type: 'FIXED_AMOUNT', value: 15, isActive: false, categoryIds: ['PHAE'],
    }), params)

    expect(response.status).toBe(200)
    expect(SimpleCouponService.updateCoupon).toHaveBeenCalledWith('PALM', {
      name: 'Palm Springs',
      type: 'FIXED_AMOUNT',
      value: 15,
      isActive: false,
      expiresAt: null,
      usageLimit: null,
      categoryIds: ['PHAE'],
    })
  })

  it('validates the body before saving', async () => {
    const bad = await PUT(request('PUT', { name: 'x', type: 'PERCENTAGE', value: 150, isActive: true }), params)
    const noActive = await PUT(request('PUT', { name: 'x', type: 'PERCENTAGE', value: 10 }), params)

    expect(bad.status).toBe(400)
    expect(noActive.status).toBe(400)
    expect(SimpleCouponService.updateCoupon).not.toHaveBeenCalled()
  })

  it('returns 404 when the coupon is gone', async () => {
    ;(SimpleCouponService.updateCoupon as jest.Mock).mockResolvedValue(false)
    ;(SimpleCouponService.deleteCoupon as jest.Mock).mockResolvedValue(false)

    expect((await PUT(request('PUT', { name: 'x', type: 'PERCENTAGE', value: 10, isActive: true }), params)).status).toBe(404)
    expect((await DELETE(request('DELETE'), params)).status).toBe(404)
  })

  it('deletes a coupon', async () => {
    ;(SimpleCouponService.deleteCoupon as jest.Mock).mockResolvedValue(true)

    const response = await DELETE(request('DELETE'), params)

    expect(response.status).toBe(200)
    expect(SimpleCouponService.deleteCoupon).toHaveBeenCalledWith('PALM')
  })
})
