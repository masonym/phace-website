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
  onSelect: (addons: string[]) => void;
  onBack: () => void;
}

export default function AddonSelection({ serviceId, onSelect, onBack }: Props) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await fetch(`/api/booking/addons?serviceId=${serviceId}`);
        if (!response.ok) throw new Error('Failed to fetch addons');
        const data = await response.json();
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
    setSelectedAddons(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      } else {
        return [...prev, addonId];
      }
    });
  };

  const handleContinue = () => {
    onSelect(selectedAddons);
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
        Back to Date & Time
      </button>

      {/* Addons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addons.map((addon) => {
          const isSelected = selectedAddons.includes(addon.id);
          return (
            <button
              key={addon.id}
              onClick={() => toggleAddon(addon.id)}
              className={`
                bg-white rounded-xl p-6 shadow-sm text-left transition-all
                ${isSelected ? 'ring-2 ring-accent' : 'hover:shadow-md'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-medium text-gray-900">{addon.name}</h3>
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors
                  ${isSelected ? 'bg-accent border-accent' : 'border-gray-300'}">
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-gray-600 mb-4">{addon.description}</p>
              <div className="flex justify-between items-center text-accent">
                <span>{addon.duration} mins</span>
                <span>${addon.price}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleContinue}
          className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
