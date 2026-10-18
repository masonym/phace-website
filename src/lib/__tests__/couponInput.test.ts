import { parseCouponFields } from '@/lib/utils/couponInput'

const valid = { name: 'Palm Springs', type: 'PERCENTAGE', value: 20 }

describe('parseCouponFields', () => {
  it('accepts the required fields and leaves optional ones unset', () => {
    expect(parseCouponFields(valid)).toEqual({
      fields: { name: 'Palm Springs', type: 'PERCENTAGE', value: 20, expiresAt: undefined, usageLimit: undefined, categoryIds: undefined },
    })
  })

  it('parses optional fields and de-duplicates categories', () => {
    const result = parseCouponFields({
      ...valid,
      expiresAt: '2026-11-01T07:00:00.000Z',
      usageLimit: 5,
      categoryIds: ['PHAE', 'PHAE', 'OTHER'],
    })
    expect('fields' in result && result.fields).toMatchObject({
      expiresAt: new Date('2026-11-01T07:00:00.000Z'),
      usageLimit: 5,
      categoryIds: ['PHAE', 'OTHER'],
    })
  })

  it('treats an empty category list as the whole order', () => {
    const result = parseCouponFields({ ...valid, categoryIds: [] })
    expect('fields' in result && result.fields.categoryIds).toBeUndefined()
  })

  it.each([
    [{ ...valid, name: ' ' }, /Name/],
    [{ ...valid, type: 'BOGUS' }, /Type/],
    [{ ...valid, value: 0 }, /greater than 0/],
    [{ ...valid, value: null }, /greater than 0/],
    [{ ...valid, value: 101 }, /exceed 100/],
    [{ ...valid, expiresAt: 'not a date' }, /valid date/],
    [{ ...valid, usageLimit: 1.5 }, /whole number/],
    [{ ...valid, categoryIds: 'PHAE' }, /categoryIds/],
  ])('rejects %o', (body, error) => {
    const result = parseCouponFields(body)
    expect('error' in result && result.error).toMatch(error)
  })

  it('allows fixed amounts over 100', () => {
    expect('fields' in parseCouponFields({ ...valid, type: 'FIXED_AMOUNT', value: 150 })).toBe(true)
  })
})
