import { isSafeUrl, parsePopupFields, pickPopup, popupStatus } from '@/lib/utils/popups'

const NOW = new Date('2026-12-01T12:00:00.000Z')

describe('parsePopupFields', () => {
  const valid = { name: 'Holiday gift cards', title: 'Give the gift of glow' }

  it('fills in defaults and leaves blank optional text unset', () => {
    const result = parsePopupFields({ ...valid, eyebrow: '   ', bullets: ['  One ', '', 'Two'] })
    expect('fields' in result && result.fields).toMatchObject({
      name: 'Holiday gift cards',
      title: 'Give the gift of glow',
      isActive: true,
      frequency: 'daily',
      delaySeconds: 2,
      eyebrow: undefined,
      bullets: ['One', 'Two'],
    })
  })

  it('normalises dates to ISO and rejects an end before the start', () => {
    const ok = parsePopupFields({ ...valid, startsAt: '2026-12-01T08:00:00.000Z', endsAt: '2026-12-25T08:00:00.000Z' })
    expect('fields' in ok && ok.fields.endsAt).toBe('2026-12-25T08:00:00.000Z')

    const backwards = parsePopupFields({ ...valid, startsAt: '2026-12-25T08:00:00.000Z', endsAt: '2026-12-01T08:00:00.000Z' })
    expect(backwards).toEqual({ error: expect.stringContaining('End date must be after') })
  })

  it('requires a name and title', () => {
    expect(parsePopupFields({})).toEqual({ error: expect.stringMatching(/Name is required.*Title is required/) })
  })

  it('rejects unsafe links and a button without both text and link', () => {
    expect(parsePopupFields({ ...valid, ctaLabel: 'Go', ctaUrl: 'javascript:alert(1)' }))
      .toEqual({ error: expect.stringContaining('Button link must start with') })
    expect(parsePopupFields({ ...valid, ctaLabel: 'Go' }))
      .toEqual({ error: expect.stringContaining('fill in both or neither') })
  })

  it('rejects an unknown frequency and out-of-range delay', () => {
    expect('error' in parsePopupFields({ ...valid, frequency: 'hourly' })).toBe(true)
    expect('error' in parsePopupFields({ ...valid, delaySeconds: 120 })).toBe(true)
  })
})

describe('popupStatus', () => {
  it('reports each state', () => {
    expect(popupStatus({ isActive: true }, NOW)).toBe('live')
    expect(popupStatus({ isActive: false }, NOW)).toBe('off')
    expect(popupStatus({ isActive: true, startsAt: '2026-12-02T00:00:00.000Z' }, NOW)).toBe('scheduled')
    expect(popupStatus({ isActive: true, endsAt: '2026-11-30T00:00:00.000Z' }, NOW)).toBe('ended')
    // An end date that has passed wins over being switched off
    expect(popupStatus({ isActive: false, endsAt: '2026-11-30T00:00:00.000Z' }, NOW)).toBe('ended')
  })
})

describe('pickPopup', () => {
  it('returns null when nothing is live', () => {
    expect(pickPopup([{ isActive: false }, { isActive: true, startsAt: '2026-12-05T00:00:00.000Z' }], NOW)).toBeNull()
  })

  it('prefers the live popup that started most recently', () => {
    const always = { id: 'always', isActive: true }
    const older = { id: 'older', isActive: true, startsAt: '2026-11-01T00:00:00.000Z' }
    const newer = { id: 'newer', isActive: true, startsAt: '2026-11-20T00:00:00.000Z' }
    expect(pickPopup([always, older, newer], NOW)?.id).toBe('newer')
    expect(pickPopup([always], NOW)?.id).toBe('always')
  })
})

describe('isSafeUrl', () => {
  it.each([
    ['https://square.link/u/abc', true],
    ['/store', true],
    ['//evil.example', false],
    ['javascript:alert(1)', false],
    ['data:text/html,hi', false],
  ])('%s -> %s', (url, expected) => {
    expect(isSafeUrl(url)).toBe(expected)
  })
})
