import { productPath, productIdFromParam } from '@/lib/utils/productUrl'
import { formatOpeningHours } from '@/lib/config/clinicInfo'
import { calculateB2G1DiscountFromPrices } from '@/lib/utils/promotions'
import { escapeHtml } from '@/lib/utils/escapeHtml'

describe('product URLs', () => {
  const id = 'W62UWFY35CWMYGVWK6TWJDNI'

  it('puts a readable slug before the Square ID', () => {
    expect(productPath(id, 'Vitamin A + Peptide Crème')).toBe(`/store/product/vitamin-a-peptide-creme-${id}`)
  })

  it('falls back to the bare ID without a name', () => {
    expect(productPath(id)).toBe(`/store/product/${id}`)
  })

  it('reads the ID back from slugged and old ID-only URLs', () => {
    expect(productIdFromParam(`vitamin-a-peptide-creme-${id}`)).toBe(id)
    expect(productIdFromParam(id)).toBe(id)
  })
})

describe('formatOpeningHours', () => {
  it('formats open and closed days', () => {
    expect(formatOpeningHours({ day: 'Tuesday', opens: '10:00', closes: '19:00' })).toBe('Tuesday: 10 AM - 7 PM')
    expect(formatOpeningHours({ day: 'Monday', opens: null, closes: null })).toBe('Monday: Closed')
    expect(formatOpeningHours({ day: 'Friday', opens: '09:30', closes: '12:00' })).toBe('Friday: 9:30 AM - 12 PM')
  })
})

describe('calculateB2G1DiscountFromPrices', () => {
  it('makes the cheapest of every three units free', () => {
    expect(calculateB2G1DiscountFromPrices([10, 30, 20])).toBe(10)
    expect(calculateB2G1DiscountFromPrices([50, 40, 30, 20, 10, 5])).toBe(35)
  })

  it('gives nothing under three units', () => {
    expect(calculateB2G1DiscountFromPrices([10, 20])).toBe(0)
  })

  it('does not reorder the caller array', () => {
    const prices = [10, 30, 20]
    calculateB2G1DiscountFromPrices(prices)
    expect(prices).toEqual([10, 30, 20])
  })
})

describe('escapeHtml', () => {
  it('escapes markup in user input', () => {
    expect(escapeHtml('<b>"Hi" & \'bye\'</b>')).toBe('&lt;b&gt;&quot;Hi&quot; &amp; &#39;bye&#39;&lt;/b&gt;')
  })
})
