'use client';

import { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { Square } from 'square';

// List of known brand names
const BRAND_NAMES = [
    "Aphina",
    "G.M. Collin",
    "Kala",
    "DMK",
    "Elle Hall",
    "Mifa",
    "Is Clinical",
    "Alumier",
    "Beautifi",
    "Bion",
    "Botanical Skincare",
    "Celluma",
    "Cheekbone",
    "Clarion",
    "ClearChoice",
    "ColorScience",
    "DermaSpark",
    "DMK",
    "DP4",
    "Freezpen",
    "Jessica",
    "Pura",
    "See You Sundae",
    "Sharplight",
    "Tizo",
    "Zena",
    "Phace",
];

export default function ProductGrid() {
    // State hooks
    const { products, isLoading, error } = useProducts();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [categoryNames, setCategoryNames] = useState<Square.CatalogObject[]>([]);
    const [windowWidth, setWindowWidth] = useState<number>(0);

    // Refs
    const categoryScrollRef = useRef<HTMLDivElement>(null);

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

            const searchParams = new URLSearchParams({
                categoryIds: Array.from(categoryIds).join(',')
            });

            try {
                const response = await fetch(`/api/categories?${searchParams}`);
                if (!response.ok) throw new Error('Failed to fetch categories');

                const names = await response.json();
                setCategoryNames(names);
            } catch (err) {
                console.error('Error fetching category names:', err);
            }
        };

        fetchCategoryNames();
    }, [products]);

    // Handle window resize for responsive layout
    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        // Set initial width
        setWindowWidth(window.innerWidth);

        // Update width on resize
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Loading and error states
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading products</div>;

    // Derived values
    const isDesktop = windowWidth >= 1024;

    // Get all unique category IDs
    const allCategoryIds = new Set<string>();
    products.forEach(product => {
        if (product.type === "ITEM" && product.itemData) {
            product.itemData.categories?.forEach(cat => {
                allCategoryIds.add(cat.id!);
            });
        }
    });

    // Separate categories into brands and product types
    const brandCategories: string[] = ['all'];
    const productTypeCategories: string[] = ['all'];

    // Populate brand and product type categories
    Array.from(allCategoryIds).forEach(categoryId => {
        const category = categoryNames.find(cat => cat.id === categoryId);
        if (category?.type === 'CATEGORY' && category.categoryData?.name && !category.categoryData.isTopLevel) {
            const categoryName = category.categoryData.name;

            // Check if this category is a brand
            if (BRAND_NAMES.some(brand => categoryName.toLowerCase().includes(brand.toLowerCase()))) {
                brandCategories.push(categoryId);
            } else {
                // If not a brand, it's a product type
                productTypeCategories.push(categoryId);
            }
        }
    });

    // Filter products based on selected category and brand
    const filteredProducts = products.filter(product => {
        if (product.type !== "ITEM" || !product.itemData) return false;

        // Check if product matches the selected category
        const matchesCategory = selectedCategory === 'all' ||
            product.itemData.categories?.some(cat => cat.id === selectedCategory);

        // Check if product matches the selected brand
        const matchesBrand = selectedBrand === 'all' ||
            product.itemData.categories?.some(cat => cat.id === selectedBrand);

        return matchesCategory && matchesBrand;
    });

    // Render category buttons
    const renderCategoryButtons = (categories: string[], isActive: string, setActive: (id: string) => void) => {
        return categories.map((categoryId) => {
            const category = categoryNames.find(cat => cat.id === categoryId);
            return (
                <button
                    key={categoryId}
                    onClick={() => setActive(categoryId)}
                    className={`px-4 py-2 rounded-md capitalize whitespace-nowrap ${isActive === categoryId
                        ? 'bg-black text-white'
                        : 'bg-[#FDECC2] hover:bg-[#FDECC2]/60'}
                        }`}
                >
                    {categoryId === 'all'
                        ? 'All'
                        : (category?.type === 'CATEGORY' && category.categoryData?.name) || 'Loading...'}
                </button>
            );
        });
    };

    return (
        <div className={`${isDesktop ? 'lg:flex lg:gap-8' : ''}`}>
            {/* Desktop Sidebar - always render but use CSS to hide/show */}
            <div className={`${isDesktop ? 'block' : 'hidden'} lg: w - 1 / 5 lg: min - w - [200px] lg: sticky lg: top - 24 lg: self - start lg: h - fit`}>
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Browse by Type</h3>
                    <div className="flex flex-col gap-2">
                        {renderCategoryButtons(productTypeCategories, selectedCategory, setSelectedCategory)}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4">Filter by Brand</h3>
                    <div className="flex flex-col gap-2">
                        {renderCategoryButtons(brandCategories, selectedBrand, setSelectedBrand)}
                    </div>
                </div>
            </div>

            <div className={`${isDesktop ? 'lg:w-4/5' : 'w-full'}`}>
                {/* Mobile Horizontal Scrolling Categories - always render but use CSS to hide/show */}
                <div className={`${isDesktop ? 'hidden' : 'block'} relative mb - 8`}>
                    <h4 className="font-medium mb-2">Browse by Type</h4>
                    <div
                        className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
                        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {renderCategoryButtons(productTypeCategories, selectedCategory, setSelectedCategory)}
                    </div>

                    <h4 className="font-medium mb-2 mt-6">Filter by Brand</h4>
                    <div
                        ref={categoryScrollRef}
                        className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
                        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {renderCategoryButtons(brandCategories, selectedBrand, setSelectedBrand)}
                    </div>
                </div>

                {/* Product Count */}
                <div className="mb-6">
                    <p className="text-gray-600">{filteredProducts.length} products</p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => {
                        if (product.type !== "ITEM" || !product.itemData) return null;

                        const firstVariation = product.itemData.variations
                            ?.find(v => v.type === "ITEM_VARIATION");

                        return (
                            <ProductCard
                                key={product.id}
                                product={{
                                    type: product.type,
                                    id: product.id,
                                    name: product.itemData.name ?? "Unnamed Product",
                                    description: product.itemData.description ?? "",
                                    price: Number(firstVariation?.itemVariationData?.pricingType === "FIXED_PRICING"
                                        ? firstVariation.itemVariationData.priceMoney?.amount ?? 0
                                        : "Variable"),
                                    currency: firstVariation?.itemVariationData?.pricingType === "FIXED_PRICING"
                                        ? firstVariation.itemVariationData.priceMoney?.currency ?? "CAD"
                                        : "CAD",
                                    categories: product.itemData.categories?.map(cat => cat.id ?? "") ?? [],
                                    images: (product.itemData as any).ecom_image_uris ?? [],
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
