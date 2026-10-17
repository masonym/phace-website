'use client';

import { FormEvent, useState } from 'react';

interface ProductWaitlistFormProps {
    productId: string;
    variationId?: string | null;
    // Stack the fields for narrow spaces like the quick-add modal
    stacked?: boolean;
}

export default function ProductWaitlistForm({ productId, variationId, stacked = false }: ProductWaitlistFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setError(null);
        try {
            const res = await fetch('/api/products/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, variationId, name, email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
            setStatus('done');
        } catch (err: any) {
            setError(err.message);
            setStatus('idle');
        }
    };

    if (status === 'done') {
        return (
            <div className="rounded-xl border border-accent-soft bg-accent/10 p-4 text-gray-800">
                <p className="font-medium">You're on the waitlist!</p>
                <p className="text-sm text-gray-600 mt-1">We'll email you as soon as it's available.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-gray-700">
                <span className="font-medium">Coming soon.</span> Join the waitlist and we'll email you when it's available.
            </p>
            <div className={`flex flex-col gap-3 ${stacked ? '' : 'sm:flex-row'}`}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (optional)"
                    autoComplete="name"
                    maxLength={100}
                    className="border rounded-lg px-4 py-2 flex-1 min-w-0 focus:ring-accent focus:border-accent"
                />
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="email"
                    className="border rounded-lg px-4 py-2 flex-1 min-w-0 focus:ring-accent focus:border-accent"
                />
            </div>
            <button
                type="submit"
                disabled={status === 'submitting'}
                className={`w-full ${stacked ? '' : 'sm:w-auto'} bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
                {status === 'submitting' ? 'Joining...' : 'Join the Waitlist'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs text-gray-500">We'll only use your email to let you know about this product.</p>
        </form>
    );
}
