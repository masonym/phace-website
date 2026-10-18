import { SimpleCouponService } from '@/lib/services/simpleCouponService'
import { dynamoDb } from '@/lib/aws-config'

jest.mock('@/lib/aws-config', () => ({
  dynamoDb: { send: jest.fn() },
  TABLES: { COUPONS: 'coupons' },
}))

const send = dynamoDb.send as jest.Mock

describe('SimpleCouponService.updateCoupon', () => {
  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue({})
  })

  it('sets given fields and removes cleared ones', async () => {
    const ok = await SimpleCouponService.updateCoupon('palm', {
      name: 'Palm Springs',
      isActive: false,
      expiresAt: new Date('2026-11-01T00:00:00.000Z'),
      usageLimit: null,
      categoryIds: [],
    })

    expect(ok).toBe(true)
    const { input } = send.mock.calls[0][0]
    expect(input.Key).toEqual({ code: 'PALM' })
    expect(input.UpdateExpression).toBe(
      'SET #name = :name, #isActive = :isActive, #expiresAt = :expiresAt REMOVE #usageLimit, #categoryIds'
    )
    expect(input.ExpressionAttributeValues).toEqual({
      ':name': 'Palm Springs',
      ':isActive': false,
      ':expiresAt': '2026-11-01T00:00:00.000Z',
    })
  })

  it('omits attribute values when only removing', async () => {
    await SimpleCouponService.updateCoupon('PALM', { usageLimit: null })

    const { input } = send.mock.calls[0][0]
    expect(input.UpdateExpression).toBe('REMOVE #usageLimit')
    expect(input.ExpressionAttributeValues).toBeUndefined()
  })

  it('returns false when the coupon does not exist', async () => {
    send.mockRejectedValue(Object.assign(new Error('nope'), { name: 'ConditionalCheckFailedException' }))
    jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(await SimpleCouponService.updateCoupon('GONE', { name: 'x' })).toBe(false)
  })
})
