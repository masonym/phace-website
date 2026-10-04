'use client';

import { useState } from 'react';

interface Addon {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface Props {
  /** Add-ons for this service, already loaded when the provider was picked */
  addons: Addon[];
  /** The treatment being booked, so the running total includes it */
  baseService?: { name: string; price: number; duration: number };
  /** Add-ons picked earlier, so going back doesn't lose them */
  initialSelectedIds?: string[];
  onSelect: (selectedAddonsData: Addon[]) => void;
  onBack: () => void;
}

// Square durations arrive in milliseconds, but some add-ons store minutes
const toMinutes = (duration: number) => (duration >= 1000 ? duration / 60000 : duration);

const formatMinutes = (minutes: number) => {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) return `${mins} min`;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
};

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AddonSelection({ addons, baseService, initialSelectedIds = [], onSelect, onBack }: Props) {
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
    // Drop any earlier picks that are no longer offered
    initialSelectedIds.filter(id => addons.some(addon => addon.id === id))
  );

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const selectedAddons = addons.filter(addon => selectedAddonIds.includes(addon.id));
  const addonsPrice = selectedAddons.reduce((total, addon) => total + addon.price, 0);
  const addonsMinutes = selectedAddons.reduce((total, addon) => total + toMinutes(addon.duration), 0);
  const totalPrice = (baseService?.price ?? 0) + addonsPrice;
  const totalMinutes = toMinutes(baseService?.duration ?? 0) + addonsMinutes;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Enhance Your Treatment</h1>
        <p className="text-center text-gray-600 mb-8">
          Optional extras{baseService ? ` for your ${baseService.name}` : ''}. Choose as many as you like, or skip this step.
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-8 text-accent hover:text-accent/80 transition-colors flex items-center"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>

      {/* Add-ons: the whole card toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="group" aria-label="Add-ons">
        {addons.map((addon) => {
          const selected = selectedAddonIds.includes(addon.id);
          const minutes = toMinutes(addon.duration);
          return (
            <button
              key={addon.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggleAddon(addon.id)}
              className={`text-left rounded-xl p-5 border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                selected
                  ? 'bg-[#F8E7E1] border-accent shadow-md'
                  : 'bg-white border-transparent shadow-sm hover:shadow-md hover:border-accent-soft/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected ? 'bg-accent border-accent text-white' : 'border-accent-soft text-transparent'
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-lg font-medium text-gray-900">{addon.name}</p>
                    <p className="font-medium text-accent whitespace-nowrap">+{formatPrice(addon.price)}</p>
                  </div>
                  {addon.description && (
                    <p className="text-gray-600 mt-1">{addon.description}</p>
                  )}
                  {minutes > 0 && (
                    <p className="text-sm text-gray-500 mt-2">Adds {formatMinutes(minutes)}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Running total; sticks to the bottom of the screen so it stays in reach on long lists */}
      <div className="sticky bottom-4 z-20 rounded-xl border border-[#DEC3C5] bg-white/95 backdrop-blur px-4 py-3 sm:px-6 sm:py-4 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div aria-live="polite">
            {baseService ? (
              <>
                <p className="font-medium text-gray-900">
                  Total {formatPrice(totalPrice)}
                  {totalMinutes > 0 && <span className="font-normal text-gray-600"> · {formatMinutes(totalMinutes)}</span>}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAddons.length === 0
                    ? 'No add-ons selected'
                    : `Includes ${selectedAddons.length} add-on${selectedAddons.length === 1 ? '' : 's'} (+${formatPrice(addonsPrice)})`}
                </p>
              </>
            ) : (
              <p className="text-gray-700">
                {selectedAddons.length === 0
                  ? 'No add-ons selected'
                  : `${selectedAddons.length} add-on${selectedAddons.length === 1 ? '' : 's'}: +${formatPrice(addonsPrice)}`}
              </p>
            )}
          </div>
          <button
            onClick={() => onSelect(selectedAddons)}
            className="flex-shrink-0 bg-accent text-white px-6 sm:px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
          >
            {selectedAddons.length === 0 ? 'Skip add-ons' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
