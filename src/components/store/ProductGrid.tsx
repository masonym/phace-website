'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { ProductService } from '@/lib/services/productService';
import { Square } from 'square';

export default function ProductGrid() {
    const { products, isLoading, error } = useProducts();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categoryNames, setCategoryNames] = useState<Square.CatalogObject[]>([]);

    // Fetch category names when products load
    useEffect(() => {
        const fetchCategoryNames = async () => {
            if (!Array.isArray(products) || products.length === 0) return;

            const categoryIds = new Set<string>();
            products.forEach((product: Square.CatalogObject) => {
                if (product.type === "ITEM" && product.itemData) {
                    product.itemData.categories?.forEach(cat => {
                        categoryIds.add(cat.id!);
                    });
                }
            });

            try {
                const names = await ProductService.getCategories(Array.from(categoryIds));
                console.log(names);
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
        if (product.type === "ITEM" && product.itemData) {
            product.itemData.categories?.forEach(cat => {
                allCategoryIds.add(cat.id!);
            });
        }
    });

    // Filter products based on selected category
    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(product =>
            product.type === "ITEM" && product.itemData?.categories?.some(cat => cat.id === selectedCategory)
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
                            : categoryNames.find(cat => cat.id === categoryId)?.type || 'Loading...'}
                    </button>
                ))}
            </div>

            {/* Product Count */}
            <div className="mb-6">
                <p className="text-gray-600">{filteredProducts.length} products</p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts
                    .map(product => {

                        if (product.type !== "ITEM" || !product.itemData) return null; // extra safeguard
                        // Get first variation to get price so that we can get rid of type union issue
                        const firstVariation = product.itemData.variations
                            ?.find(v => v.type === "ITEM_VARIATION")
                        return (
                            <ProductCard
                                key={product.id}
                                product={{
                                    id: product.id,
                                    name: product.itemData.name,
                                    description: product.itemData.description,
                                    // Add price from first variation if it exists
                                    price: firstVariation?.itemVariationData?.pricingType === "FIXED_PRICING"
                                        ? firstVariation.itemVariationData.priceMoney?.amount ?? "0"
                                        : "0",
                                    currency: firstVariation?.itemVariationData?.pricingType === "FIXED_PRICING"
                                        ? firstVariation.itemVariationData.priceMoney?.currency ?? "CAD"
                                        : "CAD",
                                    categories: product.itemData.categories?.map(cat => cat.id),
                                }}
                            />
                        )
                    })}
            </div>
        </div>
    );
}
