import { formatMoney, formatDuration } from '@/lib/utils/format'

describe('formatMoney', () => {
  it('converts Square cents to dollars', () => {
    expect(formatMoney(4500)).toBe('$45.00')
    expect(formatMoney(BigInt(12999))).toBe('$129.99')
  })

  it('treats missing amounts as zero', () => {
    expect(formatMoney(undefined)).toBe('$0.00')
    expect(formatMoney(null)).toBe('$0.00')
  })
})

describe('formatDuration', () => {
  it('converts Square milliseconds to minutes', () => {
    expect(formatDuration(30 * 60000)).toBe('30 min')
  })

  it('shows hours for longer services', () => {
    expect(formatDuration(60 * 60000)).toBe('1 hr')
    expect(formatDuration(BigInt(90 * 60000))).toBe('1 hr 30 min')
  })

  it('treats missing durations as zero', () => {
    expect(formatDuration(undefined)).toBe('0 min')
  })
})
