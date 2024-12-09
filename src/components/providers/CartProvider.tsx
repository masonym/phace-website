"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage on initial render
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

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product, quantity: number, selectedColor: ProductColor | null) => {
        setCart(prevCart => {
            // Check if item already exists in cart with same color
            const existingItemIndex = prevCart.findIndex(
                item => item.product.id === product.id && 
                       item.selectedColor?.name === selectedColor?.name
            );

            if (existingItemIndex !== -1) {
                // Update quantity of existing item
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                // Add new item to cart
                return [...prevCart, { product, quantity, selectedColor }];
            }
        });
    };

    const removeFromCart = (productId: string, colorName: string | null) => {
        setCart(prevCart => 
            prevCart.filter(
                item => !(item.product.id === productId && item.selectedColor?.name === colorName)
            )
        );
    };

    const updateQuantity = (productId: string, colorName: string | null, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(productId, colorName);
            return;
        }

        setCart(prevCart => 
            prevCart.map(item => 
                item.product.id === productId && item.selectedColor?.name === colorName
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
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
