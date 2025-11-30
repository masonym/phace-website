"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Square } from 'square';
import { CartItem } from '@/types/product';
import { showToast } from '@/components/ui/Toast';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Square.CatalogObjectItem, quantity: number, selectedVariation: Square.CatalogObjectItemVariation | null) => void;
    removeFromCart: (productId: string, variationId: string | null) => void;
    updateQuantity: (productId: string, variationId: string | null, newQuantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                // Filter out cart items with invalid prices (both basePrice and price must be > 0)
                const validCart = parsedCart.filter((item: any) => 
                    item.basePrice > 0 && 
                    item.price > 0
                );
                setCart(validCart);
            } catch (error) {
                console.error('Failed to parse cart from localStorage:', error);
                localStorage.removeItem('cart');
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Square.CatalogObjectItem, quantity: number, selectedVariation: Square.CatalogObjectItemVariation | null) => {
        // Validate price before adding to cart
        const priceAmount = selectedVariation?.itemVariationData?.priceMoney?.amount;
        if (!priceAmount || Number(priceAmount) <= 0) {
            showToast({ 
                title: 'Cannot Add to Cart', 
                description: 'This item is not available for purchase or has invalid pricing.', 
                status: 'error' 
            });
            return;
        }

        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                item => item.product.id === product.id &&
                    item.selectedVariation?.id === selectedVariation?.id
            );

            if (existingItemIndex !== -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                const price = Number(priceAmount) / 100;
                return [...prevCart, { 
                    product, 
                    quantity, 
                    selectedVariation,
                    basePrice: price,
                    price: price,
                }];
            }
        });
    };

    const removeFromCart = (productId: string, variationId: string | null) => {
        setCart(prevCart =>
            prevCart.filter(
                item => !(item.product.id === productId && item.selectedVariation?.id === variationId)
            )
        );
    };

    const updateQuantity = (productId: string, variationId: string | null, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(productId, variationId);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.product.id === productId && item.selectedVariation?.id === variationId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            const price = item.price || item.basePrice || 0;
            return total + (price * item.quantity); // Price is already in dollars
        }, 0);
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        isCartOpen,
        openCart,
        closeCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
}
