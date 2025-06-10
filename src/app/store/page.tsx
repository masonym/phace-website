import { Metadata } from 'next';
import ProductGrid from '@/components/store/ProductGrid';

export const metadata: Metadata = {
    title: 'Store | Phace',
    description: 'Shop our curated collection of premium skincare and beauty products.',
};

export default function StorePage() {
    return (
        <main className="container mx-auto px-4 py-8 pt-24">
            <h1 className="text-4xl font-bold mb-8">Our Products</h1>
            <div className="w-full max-w-[1400px] mx-auto">
                <ProductGrid />
            </div>
        </main>
    );
}
