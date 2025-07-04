import { Metadata } from 'next';
import ProductGrid from '@/components/store/ProductGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Store | Phace',
    description: 'Shop our curated collection of premium skincare and beauty products.',
};

export default function StorePage() {
    return (
        <main className="container mx-auto px-4 py-8 pt-24">
            <h1 className="text-4xl font-bold mb-8">Our Products</h1>
            
            <div className="w-full max-w-[1400px] mx-auto mb-8 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg shadow-md overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-4 md:mb-0 md:mr-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Give the Perfect Gift</h2>
                        <p className="text-gray-700">Treat someone special with a Phace gift card! Perfect for any occasion.</p>
                    </div>
                    <Link 
                        href="https://squareup.com/gift/MLQZQRE5MYB56/order" 
                        className="px-6 py-3 bg-accent hover:bg-accent/80 text-white font-medium rounded-md transition duration-300 ease-in-out shadow-sm"
                        target="_blank"
                    >
                        Shop Gift Cards
                    </Link>
                </div>
            </div>
            
            <div className="w-full max-w-[1400px] mx-auto">
                <ProductGrid />
            </div>
        </main>
    );
}
