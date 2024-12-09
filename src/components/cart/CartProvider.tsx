"use client"

import { createContext, useContext, ReactNode } from 'react';
import { useCart } from '@/hooks/useCart';
import { Product, ProductColor } from '@/types/product';

interface CartItem {
    product: Product;
    quantity: number;
    selectedColor: ProductColor | null;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity: number, selectedColor: ProductColor | null) => void;
    removeFromCart: (productId: string, colorName: string | null) => void;
    updateQuantity: (productId: string, colorName: string | null, newQuantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const cartUtils = useCart();
    return <CartContext.Provider value={cartUtils}>{children}</CartContext.Provider>;
}

export function useCartContext() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
}
