// store/product/[id]/page.tsx
import { ProductService } from '@/lib/services/productService';
import { Square } from 'square';
import { notFound } from 'next/navigation';

interface ProductPageProps {
    params: {
        id: string;
    };
}

// Helper function to format money
const formatMoney = (amount: number | bigint, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(Number(amount) / 100); // Convert from cents to dollars
};

export default async function ProductPage({ params }: ProductPageProps) {
    let product: Square.CatalogItem;

    try {
        product = await ProductService.getProductById(params.id);
        if (!product) {
            notFound();
        }
    } catch (error) {
        console.error('Failed to fetch product:', error);
        notFound();
    }

    // Type guard to ensure itemData exists
    if (!product || !('name' in product)) {
        notFound();
    }
    console.log(product)
    console.log(product.variations)

    return (
        <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-2xl mx-auto">
                {/* Product Name */}
                <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

                {/* Product Description */}
                {product.description && (
                    <p className="text-gray-600 mb-6">{product.description}</p>
                )}

                {/* Variations */}
                {product.variations && product.variations.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Options</h2>
                        <div className="space-y-2">
                            {product.variations
                                .filter((variation) => variation.type === 'ITEM_VARIATION')
                                .map((variation) => (
                                    <div
                                        key={variation.id}
                                        className="flex justify-between items-center border-b pb-2"
                                    >
                                        <span>{variation.itemVariationData?.name || 'Default'}</span>
                                        {variation.itemVariationData?.priceMoney && (
                                            <span className="font-medium">
                                                {formatMoney(
                                                    variation.itemVariationData.priceMoney.amount!,
                                                    variation.itemVariationData.priceMoney.currency!,
                                                )}
                                            </span>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Add to Cart Button */}
                <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

// Generate static params if you want to pre-render specific products
export async function generateStaticParams() {
    const products = await ProductService.listProducts();
    return products.map((product) => ({
        id: product.id,
    }));
}
