'use client';

import { useState } from 'react';
import { useCartContext } from '@/components/providers/CartProvider';
import { processInPersonPayment } from '@/app/actions/processInPersonPayment';

export default function InPersonPaymentForm() {
  const { cart, getCartTotal, clearCart } = useCartContext();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await processInPersonPayment({
        amount: getCartTotal(),
        items: cart,
        customerName,
        customerEmail,
        notes
      });

      setResult(response);
      
      if (response.success) {
        // Clear the cart if payment was successful
        clearCart();
        
        // Reset form
        setCustomerName('');
        setCustomerEmail('');
        setNotes('');
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An error occurred processing the payment'
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">In-Person Payment</h2>
        <p className="text-gray-600">
          The cart is empty. Add items to the cart before processing an in-person payment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Process In-Person Payment</h2>
      
      {result && (
        <div className={`p-4 mb-4 rounded ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name
          </label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email (Optional)
          </label>
          <input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>
        
        <div className="pt-2">
          <h3 className="font-medium mb-2">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {cart.map((item, index) => (
              <div
                key={`${item.product.id}-${item.selectedColor?.name}-${index}`}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <span>{item.quantity}x</span>
                  <span>{item.product.name}</span>
                  {item.selectedColor && (
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: item.selectedColor.hex }}
                      title={item.selectedColor.name}
                    />
                  )}
                </div>
                <span>C${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>C${getCartTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Record In-Person Payment'}
        </button>
      </form>
    </div>
  );
}
