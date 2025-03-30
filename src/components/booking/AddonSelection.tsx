'use client';

import { useState, useEffect } from 'react';

interface Addon {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface Props {
  serviceId: string;
  onSelect: (selectedAddonsData: Addon[]) => void;
  onBack: () => void;
}

export default function AddonSelection({ serviceId, onSelect, onBack }: Props) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await fetch(`/api/booking/addons?serviceId=${serviceId}`);
        if (!response.ok) throw new Error('Failed to fetch addons');
        const data: Addon[] = await response.json();
        setAddons(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAddons();
  }, [serviceId]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      } else {
        return [...prev, addonId];
      }
    });
  };

  const handleContinue = () => {
    const selectedAddonsData = addons.filter(addon => selectedAddonIds.includes(addon.id));
    onSelect(selectedAddonsData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading add-ons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const formatDuration = (durationMs: number) => {
    // Convert from milliseconds to minutes if needed
    const minutes = durationMs >= 1000 ? durationMs / 60000 : durationMs;
    return `${minutes} min`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Add Extra Services</h1>
        <p className="text-center text-gray-600 mb-8">
          Enhance your treatment with these additional services
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
        Back to Staff Selection
      </button>

      {/* Add-ons Grid */}
      <div className="grid gap-4">
        {addons.length === 0 ? (
          <p className="text-center text-gray-600">No additional services available for this treatment.</p>
        ) : (
          addons.map((addon) => (
            <div
              key={addon.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <label className="flex items-start gap-4 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAddonIds.includes(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                    className="mt-1.5 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <div className="flex-1">
                    <p className="text-lg font-medium">{addon.name}</p>
                    <p className="text-gray-600 mt-1">{addon.description}</p>
                    <div className="mt-2 space-x-4">
                      <span className="text-sm text-gray-600">Duration: {formatDuration(addon.duration)}</span>
                      <span className="text-sm text-gray-600">Price: ${(addon.price / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
        >
          Continue to Client Information
        </button>
      </div>
    </div>
  );
}
