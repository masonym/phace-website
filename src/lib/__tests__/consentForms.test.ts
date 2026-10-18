import { normalizeConsentForm, isConsentFormComplete, formatConsentAnswers } from '@/lib/utils/consentForms'

const raw = {
  id: 'F1',
  title: 'Intake',
  serviceIds: ['S1'],
  sections: [{
    id: 'sec',
    title: 'Health',
    questions: [
      { id: 'intro', type: 'markdown', label: 'Intro', required: true, content: 'Please read' },
      { id: 'name', type: 'text', label: 'Preferred name', required: true, content: 'e.g. Sam' },
      { id: 'skin', type: 'dropdown', label: 'Skin type', required: true, options: [{ id: 'o1', label: 'Oily' }, { id: 'o2', label: 'Dry' }] },
      { id: 'meds', type: 'yes-no', label: 'Taking medication?', required: true },
      { id: 'areas', type: 'checkbox', label: 'Areas', required: true, options: [{ id: 'a1', label: 'Face' }, { id: 'a2', label: 'Neck' }] },
      { id: 'odd', type: 'signature', label: 'Sign here', required: true },
    ],
  }],
}

describe('normalizeConsentForm', () => {
  it('keeps dropdown and yes-no questions and drops unknown types instead of throwing', () => {
    const form = normalizeConsentForm(raw)
    expect(form.sections[0].questions.map(q => q.type)).toEqual(['markdown', 'text', 'dropdown', 'yes-no', 'checkbox'])
    expect(form.version).toBe(1)
  })

  it('reads old placeholder-in-content text questions', () => {
    const text = normalizeConsentForm(raw).sections[0].questions[1]
    expect(text.type === 'text' && text.placeholder).toBe('e.g. Sam')
  })
})

describe('isConsentFormComplete', () => {
  const form = normalizeConsentForm(raw)
  const answered = {
    name: { value: 'Sam' },
    skin: { value: 'o2' },
    meds: { value: 'no' },
    areas: { value: ['a1'] },
  }

  it('does not require markdown blocks even if marked required', () => {
    expect(isConsentFormComplete(form, answered)).toBe(true)
  })

  it('treats an empty checkbox list or blank text as unanswered', () => {
    expect(isConsentFormComplete(form, { ...answered, areas: { value: [] } })).toBe(false)
    expect(isConsentFormComplete(form, { ...answered, name: { value: '   ' } })).toBe(false)
  })

  it('needs the box ticked on legacy single-text forms', () => {
    const legacy = normalizeConsentForm({ id: 'L', title: 'Old', content: 'Terms' })
    expect(isConsentFormComplete(legacy, {})).toBe(false)
    expect(isConsentFormComplete(legacy, { agreed: { value: true } })).toBe(true)
  })
})

describe('formatConsentAnswers', () => {
  it('uses option labels and skips markdown', () => {
    const form = normalizeConsentForm(raw)
    const answers = formatConsentAnswers(form, {
      name: { value: 'Sam', timestamp: 't' },
      skin: { value: 'o2' },
      meds: { value: 'yes' },
      areas: { value: ['a1', 'a2'] },
    })
    expect(answers.map(a => [a.question, a.answer])).toEqual([
      ['Preferred name', 'Sam'],
      ['Skin type', 'Dry'],
      ['Taking medication?', 'Yes'],
      ['Areas', 'Face, Neck'],
    ])
    expect(answers[0].timestamp).toBe('t')
  })
})
