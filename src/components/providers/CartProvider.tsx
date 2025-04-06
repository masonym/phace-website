"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Square } from 'square';
import { CartItem } from '@/types/product';

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
                setCart(JSON.parse(savedCart));
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
                return [...prevCart, { product, quantity, selectedVariation }];
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
            const price = item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0;
            return total + (Number(price) / 100 * item.quantity); // Convert cents to dollars
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
