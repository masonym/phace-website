import { getAllowedAddonIds, CATEGORIES_WITHOUT_ADDONS } from '@/lib/config/addonConfig'

describe('getAllowedAddonIds', () => {
  const addons = ['ADDON_A', 'ADDON_B']

  it('offers no add-ons in categories that skip the add-on step', () => {
    expect(getAllowedAddonIds({ id: 'SVC', categoryIds: ['OTHER', CATEGORIES_WITHOUT_ADDONS[0]] }, addons)).toEqual([])
  })

  it('offers every add-on when no rule applies', () => {
    expect(getAllowedAddonIds({ id: 'SVC', categoryIds: ['SOME_CATEGORY'] }, addons)).toEqual(addons)
    expect(getAllowedAddonIds({ id: 'SVC' }, addons)).toEqual(addons)
  })
})
