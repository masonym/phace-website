"use client";

import { useState } from 'react';
import { useCartContext } from '../providers/CartProvider';
import { Cart } from './Cart';

export function CartButton() {
    const { cart, isCartOpen, openCart, closeCart } = useCartContext();

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <>
            <button
                onClick={openCart}
                className="relative p-2 hover:bg-gray-100 rounded-full"
                aria-label="Open cart"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                </svg>
                {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {itemCount}
                    </span>
                )}
            </button>

            {isCartOpen && <Cart onClose={closeCart} />}
        </>
    );
}
