'use client';

import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/auth/clientSession';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface DiscountFormData {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  /** datetime-local value in the admin's own timezone */
  expiresAt?: string;
  usageLimit?: number;
  categoryIds: string[];
  isActive: boolean;
}

const EMPTY_FORM: DiscountFormData = {
  code: '',
  name: '',
  type: 'PERCENTAGE',
  value: 0,
  categoryIds: [],
  isActive: true,
};

// datetime-local inputs have no timezone, so convert to and from the browser's local time
const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (local?: string) => (local ? new Date(local).toISOString() : undefined);

interface Category {
  id: string;
  name: string;
  parentName?: string;
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
  categoryIds: string[];
  createdAt: string;
}

export default function AdminDiscountsPage() {
  const [formData, setFormData] = useState<DiscountFormData>(EMPTY_FORM);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [existingCoupons, setExistingCoupons] = useState<ExistingCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');

  const fetchExistingCoupons = async () => {
    try {
      const response = await adminFetch('/api/coupon/list');
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

  const fetchCategories = async () => {
    try {
      const response = await adminFetch('/api/admin/categories');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCategories(await response.json());
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategoriesError('Could not load categories from Square');
    }
  };

  useEffect(() => {
    fetchExistingCoupons();
    fetchCategories();
  }, []);

  const toggleCategory = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const categoryLabel = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? (categories.length ? 'Unknown category' : '...');

  const startEditing = (coupon: ExistingCoupon) => {
    setEditingCode(coupon.code);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      expiresAt: coupon.expiresAt ? toLocalInput(coupon.expiresAt) : undefined,
      usageLimit: coupon.usageLimit,
      categoryIds: coupon.categoryIds,
      isActive: coupon.isActive,
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stopEditing = () => {
    setEditingCode(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = { ...formData, expiresAt: fromLocalInput(formData.expiresAt) };

    try {
      const response = editingCode
        ? await adminFetch(`/api/admin/coupons/${encodeURIComponent(editingCode)}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await adminFetch('/api/coupon/create', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        setMessage(editingCode ? `${editingCode} updated.` : 'Coupon code created successfully!');
        stopEditing();
        fetchExistingCoupons();
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(editingCode ? 'Error: failed to update coupon code' : 'Error: failed to create coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const code = deletingCode;
    setDeletingCode(null);
    if (!code) return;

    try {
      const response = await adminFetch(`/api/admin/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage(`${code} deleted.`);
        if (editingCode === code) stopEditing();
        fetchExistingCoupons();
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error: failed to delete coupon code');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">
          {editingCode ? `Edit Coupon Code ${editingCode}` : 'Create Coupon Code'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Coupon Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., SAVE20"
              disabled={!!editingCode}
              required
            />
            {editingCode && (
              <p className="text-sm text-gray-500 mt-1">
                The code itself can&apos;t be changed. To rename it, create a new code and delete this one.
              </p>
            )}
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
              Applies To (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Pick categories to limit this code to those products. Leave everything unchecked to apply it to the whole order.
            </p>
            {categoriesError ? (
              <p className="text-sm text-red-600">{categoriesError}</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500">Loading categories...</p>
            ) : (
              <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span>{category.name}</span>
                    {category.parentName && (
                      <span className="text-xs text-gray-400">in {category.parentName}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
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

          {editingCode && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span className="text-sm font-medium">Active</span>
              <span className="text-sm text-gray-500">Uncheck to pause the code without deleting it</span>
            </label>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {editingCode
                ? (loading ? 'Saving...' : 'Save Changes')
                : (loading ? 'Creating...' : 'Create Coupon Code')}
            </button>
            {editingCode && (
              <button
                type="button"
                onClick={stopEditing}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
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
                  <th className="border border-gray-300 px-4 py-2 text-left">Applies To</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Usage</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Expires</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
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
                      {coupon.categoryIds.length > 0
                        ? coupon.categoryIds.map(categoryLabel).join(', ')
                        : 'Whole order'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {coupon.usageLimit 
                        ? `${coupon.currentUsage}/${coupon.usageLimit}` 
                        : `${coupon.currentUsage}/∞`}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 whitespace-nowrap">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'}
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
                    <td className="border border-gray-300 px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => startEditing(coupon)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingCode(coupon.code)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deletingCode}
        onClose={() => setDeletingCode(null)}
        onConfirm={handleDelete}
        title="Delete Coupon Code"
        message={`Delete ${deletingCode}? Customers won't be able to use it any more, and its usage count is lost. To pause it instead, edit it and uncheck Active.`}
      />
    </div>
  );
}
