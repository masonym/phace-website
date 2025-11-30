import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CartProvider, useCartContext } from '../CartProvider'
import { Square } from 'square'

// Test component to access cart context
const TestComponent = () => {
  const { cart, addToCart, getCartTotal, removeFromCart } = useCartContext()
  
  return (
    <div>
      <div data-testid="cart-count">{cart.length}</div>
      <div data-testid="cart-total">{getCartTotal()}</div>
      <button
        onClick={() => {
          // Mock product with valid price
          const mockProduct: Square.CatalogObjectItem = {
            id: 'test-product-id',
            type: 'ITEM',
            itemData: {
              name: 'Test Product',
              variations: []
            }
          }
          
          const mockVariation: Square.CatalogObjectItemVariation = {
            id: 'test-variation-id',
            type: 'ITEM_VARIATION',
            itemVariationData: {
              name: 'Regular',
              priceMoney: {
                amount: '2000',
                currency: 'CAD'
              },
              pricingType: 'FIXED_PRICING'
            }
          }
          
          addToCart(mockProduct, 1, mockVariation)
        }}
      >
        Add Valid Item
      </button>
      
      <button
        onClick={() => {
          // Mock product with invalid price (0)
          const mockProduct: Square.CatalogObjectItem = {
            id: 'test-product-id-2',
            type: 'ITEM',
            itemData: {
              name: 'Test Product 2',
              variations: []
            }
          }
          
          const mockVariation: Square.CatalogObjectItemVariation = {
            id: 'test-variation-id-2',
            type: 'ITEM_VARIATION',
            itemVariationData: {
              name: 'Regular',
              priceMoney: {
                amount: '0',
                currency: 'CAD'
              },
              pricingType: 'FIXED_PRICING'
            }
          }
          
          addToCart(mockProduct, 1, mockVariation)
        }}
      >
        Add Invalid Item
      </button>
      
      <button
        onClick={() => {
          // Mock product with missing price
          const mockProduct: Square.CatalogObjectItem = {
            id: 'test-product-id-3',
            type: 'ITEM',
            itemData: {
              name: 'Test Product 3',
              variations: []
            }
          }
          
          const mockVariation: Square.CatalogObjectItemVariation = {
            id: 'test-variation-id-3',
            type: 'ITEM_VARIATION',
            itemVariationData: {
              name: 'Regular',
              pricingType: 'FIXED_PRICING'
            }
          }
          
          addToCart(mockProduct, 1, mockVariation)
        }}
      >
        Add Missing Price Item
      </button>
    </div>
  )
}

// Mock showToast
jest.mock('@/components/ui/Toast', () => ({
  showToast: jest.fn()
}))

describe('CartProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Price Validation', () => {
    it('should allow adding items with valid prices', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      )

      const addButton = screen.getByText('Add Valid Item')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('cart-total')).toHaveTextContent('20') // 2000 cents = $20
      })
    })

    it('should reject items with zero price', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      )

      const addButton = screen.getByText('Add Invalid Item')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      })
      
      // Should show error toast
      const { showToast } = require('@/components/ui/Toast')
      expect(showToast).toHaveBeenCalledWith({
        title: 'Cannot Add to Cart',
        description: 'This item is not available for purchase or has invalid pricing.',
        status: 'error'
      })
    })

    it('should reject items with missing price', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      )

      const addButton = screen.getByText('Add Missing Price Item')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      })
      
      // Should show error toast
      const { showToast } = require('@/components/ui/Toast')
      expect(showToast).toHaveBeenCalledWith({
        title: 'Cannot Add to Cart',
        description: 'This item is not available for purchase or has invalid pricing.',
        status: 'error'
      })
    })
  })

  describe('Cart Total Calculation', () => {
    it('should calculate total using stored price fields', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      )

      // Add an item with $20 price
      const addButton = screen.getByText('Add Valid Item')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('cart-total')).toHaveTextContent('20')
      })
    })
  })

  describe('Cart Migration', () => {
    it('should filter out items with invalid prices on load', () => {
      // Mock localStorage with invalid cart items
      const invalidCart = [
        {
          product: { id: 'valid-item' },
          quantity: 1,
          selectedVariation: { id: 'var-1' },
          basePrice: 20,
          price: 20
        },
        {
          product: { id: 'invalid-item-1' },
          quantity: 1,
          selectedVariation: { id: 'var-2' },
          basePrice: 0,
          price: 0
        },
        {
          product: { id: 'invalid-item-2' },
          quantity: 1,
          selectedVariation: { id: 'var-3' },
          basePrice: undefined,
          price: undefined
        }
      ]
      
      localStorage.setItem('cart', JSON.stringify(invalidCart))
      
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      )

      // Should only have the valid item
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })
  })
})
