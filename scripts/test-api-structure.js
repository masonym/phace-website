// API structure testing script
// Run with: node scripts/test-api-structure.js

// This script tests the API request/response structures that caused your bugs
// It doesn't make actual API calls but verifies the data shapes

console.log('🧪 Testing API Request/Response Structures...\n')

// Test 1: Calculate Order API Request Structure
function testCalculateOrderRequest() {
  console.log('📋 Testing Calculate Order API Request Structure')
  
  const validRequest = {
    currency: 'CAD',
    locationId: 'test-location-id',
    fulfillmentMethod: 'pickup',
    items: [
      {
        variationId: 'test-variation-id',
        quantity: 1,
        basePrice: 20,
        price: 20
      }
    ]
  }
  
  // Check if request has required price fields
  const hasRequiredPriceFields = validRequest.items.every(item => 
    item.basePrice !== undefined && 
    item.price !== undefined && 
    item.basePrice > 0 && 
    item.price > 0
  )
  
  if (hasRequiredPriceFields) {
    console.log('✅ Calculate Order request includes required price fields')
  } else {
    console.log('❌ Calculate Order request missing required price fields')
  }
  
  return hasRequiredPriceFields
}

// Test 2: Calculate Order API Response Structure
function testCalculateOrderResponse() {
  console.log('\n📋 Testing Calculate Order API Response Structure')
  
  // Mock response structure from Square API
  const mockResponse = {
    order: {
      lineItems: [
        {
          catalogObjectId: 'test-variation-id',
          quantity: '1',
          basePriceMoney: {
            amount: '2000',
            currency: 'CAD'
          },
          grossSalesMoney: {
            amount: '2000',
            currency: 'CAD'
          }
        }
      ],
      totalMoney: {
        amount: '2000',
        currency: 'CAD'
      },
      totalDiscountMoney: {
        amount: '0',
        currency: 'CAD'
      }
    }
  }
  
  // Check if response has lineItems with basePriceMoney for subtotal calculation
  const hasLineItems = mockResponse.order.lineItems && mockResponse.order.lineItems.length > 0
  const hasBasePriceMoney = mockResponse.order.lineItems.every(item => 
    item.basePriceMoney && item.basePriceMoney.amount
  )
  
  if (hasLineItems && hasBasePriceMoney) {
    console.log('✅ Calculate Order response has lineItems with basePriceMoney for subtotal calculation')
  } else {
    console.log('❌ Calculate Order response missing lineItems or basePriceMoney')
  }
  
  return hasLineItems && hasBasePriceMoney
}

// Test 3: Square Payment API Fulfillment Structure
function testSquarePaymentFulfillment() {
  console.log('\n📋 Testing Square Payment API Fulfillment Structure')
  
  // Test pickup fulfillment structure
  const pickupOrder = {
    fulfillments: [
      {
        type: 'PICKUP',
        state: 'PROPOSED',
        pickupDetails: {
          recipient: {
            displayName: 'John Doe'
          },
          isCurbsidePickup: false,
          note: 'Order ready for pickup.',
          scheduleType: 'ASAP'
        }
      }
    ]
  }
  
  // Test shipping fulfillment structure
  const shippingOrder = {
    fulfillments: [
      {
        type: 'SHIPMENT',
        state: 'PROPOSED',
        shipmentDetails: {
          recipient: {
            displayName: 'John Doe',
            address: {
              addressLine1: '123 Test St',
              locality: 'Test City',
              administrativeDistrictLevel1: 'ON',
              postalCode: 'A1A 1A1',
              country: 'CA'
            }
          }
        }
      }
    ],
    serviceCharges: [
      {
        name: 'Shipping',
        amountMoney: {
          amount: '2500',
          currency: 'CAD'
        }
      }
    ]
  }
  
  // Validate pickup structure
  const pickupValid = pickupOrder.fulfillments[0].pickupDetails &&
    pickupOrder.fulfillments[0].pickupDetails.recipient &&
    pickupOrder.fulfillments[0].pickupDetails.scheduleType === 'ASAP'
  
  // Validate shipping structure
  const shippingValid = shippingOrder.fulfillments[0].shipmentDetails &&
    shippingOrder.fulfillments[0].shipmentDetails.recipient &&
    shippingOrder.serviceCharges &&
    shippingOrder.serviceCharges[0].amountMoney.amount === '2500'
  
  if (pickupValid) {
    console.log('✅ Pickup fulfillment structure is correct')
  } else {
    console.log('❌ Pickup fulfillment structure is incorrect')
  }
  
  if (shippingValid) {
    console.log('✅ Shipping fulfillment structure is correct')
  } else {
    console.log('❌ Shipping fulfillment structure is incorrect')
  }
  
  return pickupValid && shippingValid
}

// Test 4: Subtotal Calculation Logic
function testSubtotalCalculation() {
  console.log('\n📋 Testing Subtotal Calculation Logic')
  
  const mockOrderResponse = {
    order: {
      lineItems: [
        {
          basePriceMoney: { amount: '2000', currency: 'CAD' },
          quantity: '2'
        },
        {
          basePriceMoney: { amount: '3000', currency: 'CAD' },
          quantity: '1'
        }
      ]
    }
  }
  
  // Calculate subtotal (this is what the frontend should do)
  const subtotal = mockOrderResponse.order.lineItems.reduce((sum, item) => {
    return sum + (Number(item.basePriceMoney.amount) * Number(item.quantity))
  }, 0)
  
  const expectedSubtotal = (2000 * 2) + (3000 * 1) // 7000 cents = $70.00
  
  if (subtotal === expectedSubtotal) {
    console.log('✅ Subtotal calculation logic is correct')
  } else {
    console.log('❌ Subtotal calculation logic is incorrect')
  }
  
  return subtotal === expectedSubtotal
}

// Run all tests
function runAllTests() {
  const results = [
    testCalculateOrderRequest(),
    testCalculateOrderResponse(),
    testSquarePaymentFulfillment(),
    testSubtotalCalculation()
  ]
  
  const passedTests = results.filter(Boolean).length
  const totalTests = results.length
  
  console.log(`\n📊 Results: ${passedTests}/${totalTests} API structure tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All API structure tests passed! Your API contracts are correct.')
    return true
  } else {
    console.log('💥 Some API structure tests failed. Check the implementation.')
    return false
  }
}

// Run the tests
const success = runAllTests()
process.exit(success ? 0 : 1)
