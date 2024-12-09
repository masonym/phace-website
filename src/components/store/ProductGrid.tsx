'use client';

import { useState } from 'react';
import { Product } from '@/types/product';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useProducts';

export default function ProductGrid() {
    const { products, isLoading, error } = useProducts();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading products</div>;

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(product => product.category === selectedCategory);

    const categories = ['all', ...new Set(products.map(product => product.category))];

    return (
        <div>
            {/* Category Filter */}
            <div className="mb-8 flex gap-4">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-md capitalize ${
                            selectedCategory === category
                                ? 'bg-black text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Product Count */}
            <div className="mb-6">
                <p className="text-gray-600">{filteredProducts.length} products</p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
