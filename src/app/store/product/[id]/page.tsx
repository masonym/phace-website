"use client";

import { useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCartContext } from '@/components/providers/CartProvider';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Product, ProductColor } from '@/types/product';
import Image from 'next/image';
import { AddToCartDialog } from '@/components/cart/AddToCartDialog';

export default function ProductPage() {
    const { id } = useParams();
    const { products } = useProducts();
    const { addToCart } = useCartContext();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        const foundProduct = products.find(p => p.id === id);
        if (foundProduct) {
            setProduct(foundProduct);
            if (foundProduct.colors?.length) {
                setSelectedColor(foundProduct.colors[0]);
            }
        }
    }, [id, products]);

    if (!product) return <div>Loading...</div>;

    const validateSelection = () => {
        if (!selectedColor && product.colors?.length) {
            alert('Please select a color');
            return false;
        }
        return true;
    };

    const handleAddToCart = () => {
        if (!validateSelection()) return;
        addToCart(product, quantity, selectedColor);
        setShowDialog(true);
    };

    const handleBuyNow = () => {
        if (!validateSelection()) return;
        addToCart(product, quantity, selectedColor);
        router.push('/checkout');
    };

    return (
        <main className="container mx-auto px-4 py-8 pt-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="relative h-[500px] w-full">
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                    />
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                    <p className="text-xl font-semibold mb-4">C${product.price.toFixed(2)}</p>
                    <p className="text-gray-600 mb-6">{product.description}</p>

                    {/* Color Selection */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium mb-2">Colour</h3>
                            <div className="flex gap-2">
                                {product.colors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color)}
                                        className={`relative w-12 h-12 rounded-lg border-2 ${
                                            selectedColor?.name === color.name
                                                ? 'border-black'
                                                : 'border-transparent'
                                        }`}
                                        title={color.name}
                                    >
                                        <div
                                            className="absolute inset-1 rounded"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                    </button>
                                ))}
                            </div>
                            {selectedColor && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Selected: {selectedColor.name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Quantity Selection */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">Quantity</h3>
                        <div className="flex items-center border rounded-md w-32">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-3 py-2 hover:bg-gray-100"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full text-center border-x"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-3 py-2 hover:bg-gray-100"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleAddToCart}
                            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800"
                        >
                            Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="w-full bg-white text-black border border-black py-3 rounded-md hover:bg-gray-50"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Add to Cart Dialog */}
            {showDialog && (
                <AddToCartDialog
                    onClose={() => setShowDialog(false)}
                    onKeepShopping={() => setShowDialog(false)}
                    onCheckout={() => {
                        setShowDialog(false);
                        router.push('/checkout');
                    }}
                />
            )}
        </main>
    );
}
