'use client';

import { useState, useEffect } from 'react';

interface DiscountFormData {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  expiresAt?: string;
  usageLimit?: number;
}

interface ExistingCoupon {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  isActive: boolean;
  expiresAt?: string;
  usageLimit?: number;
  currentUsage: number;
  createdAt: string;
}

export default function AdminDiscountsPage() {
  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    name: '',
    type: 'PERCENTAGE',
    value: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [existingCoupons, setExistingCoupons] = useState<ExistingCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const fetchExistingCoupons = async () => {
    try {
      const response = await fetch('/api/coupon/list');
      if (response.ok) {
        const result = await response.json();
        setExistingCoupons(result.coupons || []);
      }
    } catch (error) {
      console.error('Failed to fetch existing coupons:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchExistingCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/coupon/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Coupon code created successfully!');
        setFormData({
          code: '',
          name: '',
          type: 'PERCENTAGE',
          value: 0,
        });
        // Refresh the coupon list
        fetchExistingCoupons();
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Failed to create coupon code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Coupon Code</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Coupon Code
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full p-3 border rounded-lg"
            placeholder="e.g., SAVE20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border rounded-lg"
            placeholder="e.g., 20% Off Sale"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Coupon Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
            className="w-full p-3 border rounded-lg"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed Amount (CAD)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {formData.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (CAD)'}
          </label>
          <input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
            className="w-full p-3 border rounded-lg"
            placeholder={formData.type === 'PERCENTAGE' ? '20' : '10.00'}
            min="0"
            step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Expiry Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={formData.expiresAt || ''}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Usage Limit (Optional)
          </label>
          <input
            type="number"
            value={formData.usageLimit || ''}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full p-3 border rounded-lg"
            placeholder="Leave empty for unlimited use"
            min="1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Coupon Code'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Note:</h3>
        <p className="text-yellow-700 text-sm">
          This admin interface creates coupon codes using a simple coupon service. 
          Customers can use these codes during checkout on your website.
        </p>
      </div>

      {/* Existing Coupons Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Existing Coupon Codes</h2>
        
        {loadingCoupons ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading existing coupons...</p>
          </div>
        ) : existingCoupons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No coupon codes created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Code</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Usage</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {existingCoupons.map((coupon) => (
                  <tr key={coupon.code}>
                    <td className="border border-gray-300 px-4 py-2 font-mono font-semibold">
                      {coupon.code}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{coupon.name}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {coupon.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `$${coupon.value}`}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {coupon.usageLimit 
                        ? `${coupon.currentUsage}/${coupon.usageLimit}` 
                        : `${coupon.currentUsage}/∞`}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        coupon.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
