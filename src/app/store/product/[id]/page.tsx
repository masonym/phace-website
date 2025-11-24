'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/components/providers/CartProvider';
import { showToast } from '@/components/ui/Toast';
import { Square } from 'square';
import Image from 'next/image';
import { motion } from 'framer-motion';
import parse from 'html-react-parser';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const formatMoney = (amount: number | bigint, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(Number(amount) / 100);
};

function extractSections(html: string) {
    const container = document.createElement('div');
    container.innerHTML = html;

    const sections: Record<string, string> = {};
    let currentKey = 'Description';
    sections[currentKey] = '';

    // TODO: This is a bit hacky, but it works for now. We should improve this later.
    // As long as a line isn't ONLY a <strong> tag we're fine 
    Array.from(container.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'P' && el.innerHTML.match(/^<strong>.*<\/strong>$/)) {
                const title = el.textContent?.replace(':', '').trim() || '';
                currentKey = title;
                sections[currentKey] = '';
            } else {
                sections[currentKey] += el.outerHTML;
            }
        }
    });

    return sections;
}

function Section({ title, content }: { title: string; content: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-t pt-4">
            <button
                onClick={() => setOpen(!open)}
                className="text-left w-full text-lg font-semibold text-gray-800 flex justify-between items-center"
            >
                {title}
                <span className="text-accent">{open ? '-' : '+'}</span>
            </button>
            {open && <div className="mt-2 text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6">{parse(content)}</div>}
        </div>
    );
}

interface ProductPageProps {
    params: {
        id: string;
    };
}

export default function ProductPage({ params }: ProductPageProps) {
    const { addToCart, openCart } = useCartContext();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState<Square.CatalogObjectItem | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<Square.CatalogObjectItemVariation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${params.id}`);
                if (!response.ok) throw new Error('Product not found');
                const data = await response.json();
                setProduct(data);
                if (data.itemData.variations) {
                    setSelectedVariation(
                        data.itemData.variations.find((v: Square.CatalogObject) => v.type === 'ITEM_VARIATION') || null
                    );
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id, router]);

    // this also needs to be changed in ProductCard.tsx
    const isAlumierProduct = product?.itemData?.name?.includes('AlumierMD') || product?.itemData?.name?.includes('AlumierMD') || false;

    const handleAddToCart = () => {
        if (!product || !selectedVariation) return;
        if (quantity < 1) {
            showToast({ title: 'Invalid Quantity', description: 'Enter a quantity of 1 or more', status: 'error' });
            return;
        }
        addToCart(product, quantity, selectedVariation);
        openCart();
        showToast({ title: 'Added to Cart', description: `${quantity} item(s) added.`, status: 'success' });
    };
    
    const handleAlumierRedirect = () => {
        window.open('https://ca.alumiermd.com/account/register?code=E2BVZCUK', '_blank');
        showToast({ 
            title: 'AlumierMD Registration', 
            description: 'You are being redirected to register with our AlumierMD code', 
            status: 'info' 
        });
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-32 text-center text-gray-500">Loading product...</div>;
    }

    if (error || !product) return null;

    const sections = extractSections(product.itemData!.descriptionHtml!);

    let buttonLabel = isAlumierProduct ? 'Shop with AlumierMD' : 'Add to Cart';
    if (!selectedVariation) {
        buttonLabel = 'Select an option';
    } else if (selectedVariation.itemVariationData?.locationOverrides?.some((loc) => loc.soldOut)) {
        buttonLabel = 'Out of Stock';
    } else if (!selectedVariation.itemVariationData?.priceMoney?.amount) {
        buttonLabel = 'Unavailable';
    }

    console.log(product)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-24">
            <div className="mb-8">
                <Link href="/store" className="inline-flex items-center text-accent hover:text-accent-dark transition-colors gap-2 font-medium">
                    <ArrowLeft size={18} />
                    Back to Store
                </Link>
            </div>
            <div className="w-full h-[500px] relative mb-10">
                {/* Use the ecom_image_uris array that contains URLs extracted from related_objects */}
                {(product.itemData as any).ecom_image_uris?.[0] && (
                    <Image
                        src={(product.itemData as any).ecom_image_uris[0]}
                        alt={product.itemData!.name || 'Product Image'}
                        fill
                        className="object-contain"
                    />
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-5xl font-semibold tracking-tight text-gray-900">{product.itemData!.name}</h1>

                {sections['Description'] && (
                    <div className="text-lg text-gray-600 leading-relaxed">{parse(sections['Description'])}</div>
                )}

                {product.itemData!.variations && (
                    <div>
                        <h2 className="text-2xl font-medium text-gray-800 mb-4">Options</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {product.itemData!.variations
                                .filter((v: Square.CatalogObject) => v.type === 'ITEM_VARIATION')
                                .map((variation: Square.CatalogObjectItemVariation) => (
                                    <div
                                        key={variation.id}
                                        className={`border rounded-xl p-4 cursor-pointer transition-shadow duration-300 ${selectedVariation?.id === variation.id ? 'border-accent shadow-md bg-accent/10' : 'hover:shadow-sm'
                                            }`}
                                        onClick={() => setSelectedVariation(variation)}
                                    >
                                        <div className="font-medium">{variation.itemVariationData?.name}</div>
                                        {variation.itemVariationData?.priceMoney && (
                                            <div className="text-sm text-gray-700 mt-1">
                                                {formatMoney(
                                                    variation.itemVariationData.priceMoney.amount!,
                                                    variation.itemVariationData.priceMoney.currency!
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="quantity" className="block text-lg font-medium text-gray-800 mb-2">
                        Quantity
                    </label>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-all"
                        >

                            -
                        </button>
                        <input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                            className="border rounded-lg px-4 py-2 w-24 focus:ring-accent focus:border-accent"
                        />
                        <button
                            onClick={() => setQuantity(quantity + 1)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-all"
                        >

                            +
                        </button>
                        {isAlumierProduct ? (
                            <button
                                onClick={handleAlumierRedirect}
                                className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-all"
                            >
                                {buttonLabel}
                            </button>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                disabled={buttonLabel !== 'Add to Cart'}
                                className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {buttonLabel}
                            </button>
                        )}
                    </div>
                </div>

                {/* collapsible sections */}
                {Object.entries(sections)
                    .filter(([title]) => title !== 'Description')
                    .map(([title, content]) => (
                        <Section key={title} title={title} content={content} />
                    ))}
            </div>
        </motion.div>
    );
}
