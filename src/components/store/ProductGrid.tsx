'use client';

import { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useProducts';
import type { Square } from 'square';

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
    "Bushbalm",
    "Colorescience"
];

// Skeleton loading component for product grid
function ProductGridSkeleton() {
    return (
        <div className="container mx-auto px-4 py-24">
            {/* Desktop sidebar skeleton */}
            <div className="hidden lg:block lg:w-1/5 lg:min-w-[200px] lg:sticky lg:top-24 lg:self-start lg:h-fit mb-8">
                <div className="mb-8">
                    <div className="h-7 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="flex flex-col gap-2">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="h-7 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="flex flex-col gap-2">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile filters skeleton */}
            <div className="lg:hidden mb-8">
                <div className="mb-6">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product count skeleton */}
            <div className="mb-6">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                        {/* Product image skeleton */}
                        <div className="relative h-64 w-full bg-gray-200 animate-pulse"></div>
                        
                        {/* Product content skeleton */}
                        <div className="p-4">
                            {/* Product title skeleton */}
                            <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                            
                            {/* Price skeleton */}
                            <div className="mb-4">
                                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            
                            {/* Add to cart button skeleton */}
                            <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ProductGrid() {
    // State hooks
    const { products, isLoading, error } = useProducts();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [categoryNames, setCategoryNames] = useState<Square.CatalogObject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
    const [filtersRestored, setFiltersRestored] = useState(false);
    const [discountPreviews, setDiscountPreviews] = useState<Map<string, { minSalePriceCents: number | null; discountPercent: number | null }>>(new Map());

    // Refs
    const categoryScrollRef = useRef<HTMLDivElement>(null);

    // Batch fetch discount previews for all products
    useEffect(() => {
        const fetchBatchDiscountPreviews = async () => {
            if (!Array.isArray(products) || products.length === 0) return;

            // Check cache first
            const cacheKey = 'discount-previews';
            const cached = sessionStorage.getItem(cacheKey);
            const now = Date.now();
            
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    // Use cache if less than 5 minutes old
                    if (now - timestamp < 5 * 60 * 1000) {
                        setDiscountPreviews(new Map(Object.entries(data)));
                        return;
                    }
                } catch (e) {
                    // Ignore cache errors and fetch fresh
                }
            }

            // Collect all variation IDs from products
            const allVariationIds: string[] = [];
            const productVariationMap = new Map<string, { variationIds: string[]; minOriginalPriceCents?: number }>();
            
            products.forEach(product => {
                if (product.type !== "ITEM" || !product.itemData) return;
                
                const variations = product.itemData.variations
                    ?.filter(v => v.type === "ITEM_VARIATION") ?? [];
                const variationIds = variations.map(v => v.id!).filter(Boolean);
                const fixedPriced = variations.filter(v => v.itemVariationData?.pricingType === 'FIXED_PRICING');
                const minOriginalPriceCents = fixedPriced.length > 0
                    ? fixedPriced.reduce((min, v) => {
                        const amt = Number(v.itemVariationData?.priceMoney?.amount ?? 0);
                        return min === null ? amt : Math.min(min, amt);
                      }, null as number | null) ?? undefined
                    : undefined;

                if (variationIds.length > 0) {
                    allVariationIds.push(...variationIds);
                    productVariationMap.set(product.id, { variationIds, minOriginalPriceCents });
                }
            });

            if (allVariationIds.length === 0) return;

            try {
                // Single API call for all variations
                const res = await fetch('/api/preview-variations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variationIds: allVariationIds,
                        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
                    }),
                });

                if (!res.ok) return;

                const batchData = await res.json();
                
                // Process batch data and map back to individual products
                const previewMap = new Map();
                
                productVariationMap.forEach((productData, productId) => {
                    // For each product, find the minimum discounted price among its variations
                    const productVariationIds = productData.variationIds;
                    
                    // Find the minimum discounted price for this product's variations
                    const productResults = batchData.results?.filter((result: any) => 
                        productVariationIds.includes(result.variationId)
                    ) || [];
                    
                    const minDiscounted = productResults.length > 0
                        ? productResults.reduce((min: number | null, result: any) => {
                            const price = result.discountedUnitPriceCents;
                            return min === null || price < min ? price : min;
                        }, null)
                        : null;
                    
                    let discountPercent = null;
                    const baselineOriginal = typeof productData.minOriginalPriceCents === 'number'
                        ? productData.minOriginalPriceCents
                        : null;
                    
                    if (baselineOriginal && minDiscounted !== null && minDiscounted < baselineOriginal) {
                        const pct = Math.round(100 - (minDiscounted / baselineOriginal) * 100);
                        discountPercent = pct;
                    }
                    
                    previewMap.set(productId, {
                        minSalePriceCents: minDiscounted,
                        discountPercent
                    });
                });

                setDiscountPreviews(previewMap);
                
                // Cache the results
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    data: Object.fromEntries(previewMap),
                    timestamp: now
                }));
                
            } catch (error) {
                console.error('Failed to fetch batch discount previews:', error);
            }
        };

        fetchBatchDiscountPreviews();
    }, [products]);

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

    // Restore filters from the URL so coming back from a product page keeps them
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setSelectedCategory(params.get('type') || 'all');
        setSelectedBrand(params.get('brand') || 'all');
        setSearchQuery(params.get('q') || '');
        const sort = params.get('sort');
        if (sort === 'price-asc' || sort === 'price-desc' || sort === 'name') setSortBy(sort);
        setFiltersRestored(true);
    }, []);

    useEffect(() => {
        if (!filtersRestored) return;
        const params = new URLSearchParams(window.location.search);
        const setOrDelete = (key: string, value: string, defaultValue: string) => {
            if (value && value !== defaultValue) params.set(key, value);
            else params.delete(key);
        };
        setOrDelete('type', selectedCategory, 'all');
        setOrDelete('brand', selectedBrand, 'all');
        setOrDelete('q', searchQuery.trim(), '');
        setOrDelete('sort', sortBy, 'featured');
        const query = params.toString();
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    }, [selectedCategory, selectedBrand, searchQuery, sortBy, filtersRestored]);

    // Loading and error states
    if (isLoading) return <ProductGridSkeleton />;
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-red-600 mb-4">We couldn&apos;t load our products right now.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                    Try Again
                </button>
            </div>
        );
    }

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

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query ||
            (product.itemData.name ?? '').toLowerCase().includes(query) ||
            (product.itemData.description ?? '').toLowerCase().includes(query);

        return matchesCategory && matchesBrand && matchesSearch;
    });

    const lowestPriceCents = (product: Square.CatalogObject) => {
        if (product.type !== 'ITEM') return Infinity;
        const prices = (product.itemData?.variations ?? [])
            .filter(v => v.type === 'ITEM_VARIATION' && v.itemVariationData?.pricingType === 'FIXED_PRICING')
            .map(v => Number((v as any).itemVariationData?.priceMoney?.amount ?? 0));
        const sale = discountPreviews.get(product.id)?.minSalePriceCents;
        const base = prices.length ? Math.min(...prices) : Infinity;
        return typeof sale === 'number' ? Math.min(sale, base) : base;
    };
    const productName = (product: Square.CatalogObject) =>
        product.type === 'ITEM' ? product.itemData?.name ?? '' : '';

    const sortedProducts = sortBy === 'featured'
        ? filteredProducts
        : [...filteredProducts].sort((a, b) => {
            if (sortBy === 'name') return productName(a).localeCompare(productName(b));
            const diff = lowestPriceCents(a) - lowestPriceCents(b);
            return sortBy === 'price-asc' ? diff : -diff;
        });

    const hasActiveFilters = selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery.trim() !== '';
    const clearFilters = () => {
        setSelectedCategory('all');
        setSelectedBrand('all');
        setSearchQuery('');
    };

    // Render category buttons
    const renderCategoryButtons = (categories: string[], isActive: string, setActive: (id: string) => void) => {
        return categories.map((categoryId) => {
            const category = categoryNames.find(cat => cat.id === categoryId);
            return (
                <button
                    key={categoryId}
                    onClick={() => setActive(categoryId)}
                    aria-pressed={isActive === categoryId}
                    className={`px-4 py-2 rounded-md capitalize whitespace-nowrap ${isActive === categoryId
                        ? 'bg-black text-white'
                        : 'bg-[#FDECC2] hover:bg-[#FDECC2]/60'}`}
                >
                    {categoryId === 'all'
                        ? 'All'
                        : (category?.type === 'CATEGORY' && category.categoryData?.name) || 'Loading...'}
                </button>
            );
        });
    };

    return (
        <div className="lg:flex lg:gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:w-1/5 lg:min-w-[200px] lg:sticky lg:top-24 lg:self-start lg:h-fit">
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

            <div className="w-full lg:w-4/5">
                {/* Search and sort */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <label htmlFor="store-search" className="sr-only">Search products</label>
                    <input
                        id="store-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products"
                        className="flex-1 px-4 py-2 border rounded-md bg-white"
                    />
                    <label htmlFor="store-sort" className="sr-only">Sort products</label>
                    <select
                        id="store-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="px-4 py-2 border rounded-md bg-white"
                    >
                        <option value="featured">Featured</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name">Name: A to Z</option>
                    </select>
                </div>

                {/* Mobile Horizontal Scrolling Categories */}
                <div className="lg:hidden relative mb-8">
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
                <div className="mb-6 flex items-center gap-4">
                    <p className="text-gray-600" aria-live="polite">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </p>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-sm underline text-gray-700 hover:text-black">
                            Clear filters
                        </button>
                    )}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-lg">
                        <p className="text-gray-700 mb-4">No products match your filters.</p>
                        <button
                            onClick={clearFilters}
                            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                        >
                            Show all products
                        </button>
                    </div>
                )}

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {sortedProducts.map(product => {
                        if (product.type !== "ITEM" || !product.itemData) return null;

                        const variations = product.itemData.variations
                            ?.filter(v => v.type === "ITEM_VARIATION") ?? [];
                        const firstVariation = variations[0];
                        const variationIds = variations.map(v => v.id!).filter(Boolean);
                        const fixedPriced = variations.filter(v => v.itemVariationData?.pricingType === 'FIXED_PRICING');
                        const minOriginalPriceCents = fixedPriced.length > 0
                            ? fixedPriced.reduce((min, v) => {
                                const amt = Number(v.itemVariationData?.priceMoney?.amount ?? 0);
                                return min === null ? amt : Math.min(min, amt);
                              }, null as number | null) ?? undefined
                            : undefined;

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
                                    // The ecom_image_uris array already contains URL strings, no need to map them
                                    images: (product.itemData as any).ecom_image_uris ?? [],
                                    // For discount preview (batch across variations)
                                    variationIds,
                                    minOriginalPriceCents,
                                }}
                                discountPreview={discountPreviews.get(product.id)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
