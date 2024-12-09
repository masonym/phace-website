import { useState, useEffect } from 'react';
import { Product, ProductColor } from '@/types/product';

interface CartItem {
    product: Product;
    quantity: number;
    selectedColor: ProductColor | null;
}

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage on initial render
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
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

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
    };
};
