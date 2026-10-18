import { splitSellerNote } from '@/lib/utils/bookingNotes'

describe('splitSellerNote', () => {
  it('separates visit details from consent answers', () => {
    const note = 'Running late\n\n---\n- Facial (60 min)\n\nEst. Total Price: $120.00\n\n---\n\nCONSENT FORMS:\n\nIntake\nAllergies?: None\n\n'
    expect(splitSellerNote(note)).toEqual({
      details: 'Running late\n\n---\n- Facial (60 min)\n\nEst. Total Price: $120.00',
      consent: 'Intake\nAllergies?: None',
    })
  })

  it('drops the consent section when no forms were filled in', () => {
    expect(splitSellerNote('- Facial (60 min)\n\n---\n\nCONSENT FORMS:\n')).toEqual({ details: '- Facial (60 min)', consent: undefined })
  })

  it('keeps notes written in Square as-is', () => {
    expect(splitSellerNote('Prefers afternoon')).toEqual({ details: 'Prefers afternoon' })
    expect(splitSellerNote(undefined)).toEqual({})
  })
})
