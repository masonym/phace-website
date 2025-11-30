/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../square-payment/route'

// Mock Square client
jest.mock('square', () => ({
  SquareClient: jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn()
    },
    payments: {
      create: jest.fn()
    }
  }))
}))

describe('/api/square-payment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Fulfillment Structure', () => {
    it('should create pickup fulfillment with correct structure', async () => {
      const { SquareClient } = require('square')
      const mockSquareClient = new SquareClient()
      
      // Mock successful order creation
      mockSquareClient.orders.create.mockResolvedValue({
        order: {
          id: 'test-order-id',
          totalMoney: { amount: '2000', currency: 'CAD' }
        }
      })

      // Mock successful payment creation
      mockSquareClient.payments.create.mockResolvedValue({
        payment: {
          id: 'test-payment-id',
          status: 'COMPLETED'
        }
      })

      const requestBody = {
        sourceId: 'test-source-id',
        currency: 'CAD',
        items: [
          {
            variationId: 'test-variation-id',
            quantity: 1,
            basePrice: 20,
            price: 20
          }
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Test St',
          city: 'Test City',
          state: 'ON',
          zipCode: 'A1A 1A1',
          country: 'CA'
        },
        locationId: 'test-location-id',
        fulfillmentMethod: 'pickup'
      }

      const request = new NextRequest('http://localhost:3000/api/square-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      
      // Verify the order was created with correct pickup fulfillment structure
      expect(mockSquareClient.orders.create).toHaveBeenCalledWith({
        order: expect.objectContaining({
          fulfillments: [
            expect.objectContaining({
              type: 'PICKUP',
              state: 'PROPOSED',
              pickupDetails: expect.objectContaining({
                recipient: expect.objectContaining({
                  displayName: 'John Doe'
                }),
                isCurbsidePickup: false,
                note: 'Order ready for pickup.',
                scheduleType: 'ASAP'
              })
            })
          ]
        })
      })
    })

    it('should create shipping fulfillment with correct structure', async () => {
      const { SquareClient } = require('square')
      const mockSquareClient = new SquareClient()
      
      // Mock successful order creation
      mockSquareClient.orders.create.mockResolvedValue({
        order: {
          id: 'test-order-id',
          totalMoney: { amount: '4500', currency: 'CAD' } // $20 + $25 shipping
        }
      })

      // Mock successful payment creation
      mockSquareClient.payments.create.mockResolvedValue({
        payment: {
          id: 'test-payment-id',
          status: 'COMPLETED'
        }
      })

      const requestBody = {
        sourceId: 'test-source-id',
        currency: 'CAD',
        items: [
          {
            variationId: 'test-variation-id',
            quantity: 1,
            basePrice: 20,
            price: 20
          }
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Test St',
          city: 'Test City',
          state: 'ON',
          zipCode: 'A1A 1A1',
          country: 'CA'
        },
        locationId: 'test-location-id',
        fulfillmentMethod: 'shipping'
      }

      const request = new NextRequest('http://localhost:3000/api/square-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      
      // Verify the order was created with correct shipping fulfillment structure
      expect(mockSquareClient.orders.create).toHaveBeenCalledWith({
        order: expect.objectContaining({
          fulfillments: [
            expect.objectContaining({
              type: 'SHIPMENT',
              state: 'PROPOSED',
              shipmentDetails: expect.objectContaining({
                recipient: expect.objectContaining({
                  displayName: 'John Doe',
                  address: expect.objectContaining({
                    addressLine1: '123 Test St',
                    locality: 'Test City',
                    administrativeDistrictLevel1: 'ON',
                    postalCode: 'A1A 1A1',
                    country: 'CA'
                  })
                })
              })
            })
          ],
          serviceCharges: [
            expect.objectContaining({
              name: 'Shipping',
              amountMoney: {
                amount: '2500', // $25 shipping
                currency: 'CAD'
              }
            })
          ]
        })
      })
    })
  })

  describe('Price Data Validation', () => {
    it('should include basePriceMoney in order creation', async () => {
      const { SquareClient } = require('square')
      const mockSquareClient = new SquareClient()
      
      mockSquareClient.orders.create.mockResolvedValue({
        order: {
          id: 'test-order-id',
          totalMoney: { amount: '2000', currency: 'CAD' }
        }
      })

      mockSquareClient.payments.create.mockResolvedValue({
        payment: {
          id: 'test-payment-id',
          status: 'COMPLETED'
        }
      })

      const requestBody = {
        sourceId: 'test-source-id',
        currency: 'CAD',
        items: [
          {
            variationId: 'test-variation-id',
            quantity: 1,
            basePrice: 20,
            price: 20
          }
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Test St',
          city: 'Test City',
          state: 'ON',
          zipCode: 'A1A 1A1',
          country: 'CA'
        },
        locationId: 'test-location-id',
        fulfillmentMethod: 'pickup'
      }

      const request = new NextRequest('http://localhost:3000/api/square-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await POST(request)

      // Verify basePriceMoney is included in line items
      expect(mockSquareClient.orders.create).toHaveBeenCalledWith({
        order: expect.objectContaining({
          lineItems: [
            expect.objectContaining({
              catalogObjectId: 'test-variation-id',
              quantity: '1',
              basePriceMoney: {
                amount: '2000', // $20 in cents
                currency: 'CAD'
              }
            })
          ]
        })
      })
    })
  })
})
