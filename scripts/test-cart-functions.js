// Simple test script for cart functions
// Run with: node scripts/test-cart-functions.js

// Test the core logic that caused the recent bugs
// No Jest, no complex mocking - just pure function testing

// Mock localStorage
const mockLocalStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null
  },
  setItem: function(key, value) {
    this.data[key] = value
  },
  removeItem: function(key) {
    delete this.data[key]
  },
  clear: function() {
    this.data = {}
  }
}

// Test functions (copied from CartProvider logic)
function getCartTotal(cart) {
  return cart.reduce((total, item) => {
    const price = item.price || item.basePrice || 0
    return total + (price * item.quantity)
  }, 0)
}

function addToCart(cart, product, quantity, selectedVariation) {
  // Validate price before adding to cart
  const priceAmount = selectedVariation?.itemVariationData?.priceMoney?.amount
  if (!priceAmount || Number(priceAmount) <= 0) {
    console.log('❌ Would show error toast: Invalid pricing')
    return cart // Return unchanged cart
  }

  const existingItemIndex = cart.findIndex(
    item => item.product.id === product.id &&
      item.selectedVariation?.id === selectedVariation?.id
  )

  if (existingItemIndex !== -1) {
    const newCart = [...cart]
    newCart[existingItemIndex].quantity += quantity
    return newCart
  } else {
    const price = Number(priceAmount) / 100
    return [...cart, { 
      product, 
      quantity, 
      selectedVariation,
      basePrice: price,
      price: price,
    }]
  }
}

function migrateCartItems(parsedCart) {
  // Filter out cart items with invalid prices (both basePrice and price must be > 0)
  const validCart = parsedCart.filter((item) => 
    item.basePrice > 0 && 
    item.price > 0
  )
  return validCart
}

// Test data
const mockProduct = {
  id: 'test-product-id',
  type: 'ITEM',
  itemData: {
    name: 'Test Product',
    variations: []
  }
}

const mockValidVariation = {
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

const mockInvalidVariation = {
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

const mockMissingPriceVariation = {
  id: 'test-variation-id-3',
  type: 'ITEM_VARIATION',
  itemVariationData: {
    name: 'Regular',
    pricingType: 'FIXED_PRICING'
  }
}

// Test runner
function runTests() {
  console.log('🧪 Testing Cart Functions...\n')
  
  let passedTests = 0
  let totalTests = 0

  function test(name, fn) {
    totalTests++
    try {
      fn()
      console.log(`✅ ${name}`)
      passedTests++
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`)
    }
  }

  function expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`)
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
        }
      },
      toHaveLength: (expected) => {
        if (actual.length !== expected) {
          throw new Error(`Expected length ${expected}, got ${actual.length}`)
        }
      },
      not: {
        toHaveBeenCalled: () => {
          // Mock implementation
        }
      }
    }
  }

  // Test getCartTotal
  test('getCartTotal should calculate total correctly', () => {
    const cart = [
      {
        product: mockProduct,
        quantity: 2,
        selectedVariation: mockValidVariation,
        basePrice: 20,
        price: 20
      },
      {
        product: mockProduct,
        quantity: 1,
        selectedVariation: mockValidVariation,
        basePrice: 30,
        price: 30
      }
    ]

    const total = getCartTotal(cart)
    expect(total).toBe(70) // (20 * 2) + (30 * 1)
  })

  test('getCartTotal should handle empty cart', () => {
    const total = getCartTotal([])
    expect(total).toBe(0)
  })

  test('getCartTotal should use basePrice as fallback', () => {
    const cart = [
      {
        product: mockProduct,
        quantity: 1,
        selectedVariation: mockValidVariation,
        basePrice: 25,
        price: undefined
      }
    ]

    const total = getCartTotal(cart)
    expect(total).toBe(25)
  })

  // Test addToCart
  test('addToCart should add items with valid prices', () => {
    const cart = []
    const result = addToCart(cart, mockProduct, 1, mockValidVariation)

    expect(result).toHaveLength(1)
    expect(result[0].basePrice).toBe(20)
    expect(result[0].price).toBe(20)
  })

  test('addToCart should reject items with zero price', () => {
    const cart = []
    const result = addToCart(cart, mockProduct, 1, mockInvalidVariation)

    expect(result).toHaveLength(0)
  })

  test('addToCart should reject items with missing price', () => {
    const cart = []
    const result = addToCart(cart, mockProduct, 1, mockMissingPriceVariation)

    expect(result).toHaveLength(0)
  })

  test('addToCart should update quantity for existing items', () => {
    const cart = [
      {
        product: mockProduct,
        quantity: 1,
        selectedVariation: mockValidVariation,
        basePrice: 20,
        price: 20
      }
    ]

    const result = addToCart(cart, mockProduct, 2, mockValidVariation)

    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(3)
  })

  // Test migration
  test('migrateCartItems should filter out invalid items', () => {
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

    const result = migrateCartItems(invalidCart)
    expect(result).toHaveLength(1)
    expect(result[0].product.id).toBe('valid-item')
  })

  // Results
  console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Cart functions are working correctly.')
    return true
  } else {
    console.log('💥 Some tests failed. Check the implementation.')
    return false
  }
}

// Run the tests
const success = runTests()
process.exit(success ? 0 : 1)
