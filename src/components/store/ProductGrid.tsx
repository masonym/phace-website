'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useProducts';

export default function ProductGrid() {
    const { products, isLoading, error } = useProducts();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map());

    // Fetch category names when products load
    useEffect(() => {
        const fetchCategoryNames = async () => {
            if (!Array.isArray(products) || products.length === 0) return;

            const categoryIds = new Set<string>();
            products.forEach(product => {
                product.item_data.categories?.forEach(cat => {
                    categoryIds.add(cat.id);
                });
            });

            try {
                const names = new Map<string, string>();
                for (const id of categoryIds) {
                    const response = await client.catalog.object.get({
                        objectId: id,
                    });
                    if (response?.result?.object?.categoryData?.name) {
                        names.set(id, response.result.object.categoryData.name);
                    }
                }
                setCategoryNames(names);
            } catch (err) {
                console.error('Error fetching category names:', err);
            }
        };

        fetchCategoryNames();
    }, [products]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading products</div>;

    // Get all unique category IDs
    const allCategoryIds = new Set<string>();
    products.forEach(product => {
        product.item_data.categories?.forEach(cat => {
            allCategoryIds.add(cat.id);
        });
    });

    // Filter products based on selected category
    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(product =>
            product.item_data.categories?.some(cat => cat.id === selectedCategory)
        );

    // Create category options for the filter buttons
    const categories = ['all', ...Array.from(allCategoryIds)];

    return (
        <div>
            {/* Category Filter */}
            <div className="mb-8 flex gap-4">
                {categories.map((categoryId) => (
                    <button
                        key={categoryId}
                        onClick={() => setSelectedCategory(categoryId)}
                        className={`px-4 py-2 rounded-md capitalize ${selectedCategory === categoryId
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        {categoryId === 'all'
                            ? 'All'
                            : categoryNames.get(categoryId) || 'Loading...'}
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
                    <ProductCard
                        key={product.id}
                        product={{
                            id: product.id,
                            name: product.item_data.name,
                            description: product.item_data.description,
                            // Add price from first variation if it exists
                            price: product.item_data.variations[0]?.itemVariationData?.priceMoney?.amount,
                            currency: product.item_data.variations[0]?.itemVariationData?.priceMoney?.currency,
                            categories: product.item_data.categories?.map(cat => cat.id),
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
