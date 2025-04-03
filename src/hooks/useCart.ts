import { useState, useEffect } from 'react';
import { CartItem } from '@/types/product';
import { Square } from 'square';

export const useCart = () => {
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

    const addToCart = (product: Square.CatalogItem, quantity: number, selectedVariation: Square.CatalogItemVariation | null) => {
        setCart(prevCart => {
            // Check if item already exists in cart with same variation
            const existingItemIndex = prevCart.findIndex(
                item => item.product.id === product.id &&
                    item.selectedVariation?.id === selectedVariation?.id
            );

            if (existingItemIndex !== -1) {
                // Update quantity of existing item
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                // Add new item to cart
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

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            const price = item.selectedVariation?.itemVariationData?.priceMoney?.amount || 0;
            return total + (Number(price) / 100 * item.quantity); // Convert cents to dollars
        }, 0);
    };

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
    };
};
