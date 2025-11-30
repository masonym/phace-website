/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../calculate-order/route'

// Mock Square client
jest.mock('square', () => ({
  SquareClient: jest.fn().mockImplementation(() => ({
    orders: {
      calculate: jest.fn()
    }
  }))
}))

describe('/api/calculate-order', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Price Validation', () => {
    it('should reject items without basePrice or price', async () => {
      const requestBody = {
        currency: 'CAD',
        items: [
          {
            variationId: 'test-variation-id',
            quantity: 1,
            // Missing basePrice and price
          }
        ],
        locationId: 'test-location-id'
      }

      const request = new NextRequest('http://localhost:3000/api/calculate-order', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('missing valid price data')
    })

    it('should reject items with zero or negative prices', async () => {
      const requestBody = {
        currency: 'CAD',
        items: [
          {
            variationId: 'test-variation-id',
            quantity: 1,
            basePrice: 0,
            price: 0
          }
        ],
        locationId: 'test-location-id'
      }

      const request = new NextRequest('http://localhost:3000/api/calculate-order', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('missing valid price data')
    })

    it('should accept items with valid prices', async () => {
      // Mock successful Square response
      const { SquareClient } = require('square')
      const mockSquareClient = new SquareClient()
      mockSquareClient.orders.calculate.mockResolvedValue({
        order: {
          lineItems: [
            {
              catalogObjectId: 'test-variation-id',
              quantity: '1',
              basePriceMoney: { amount: '2000', currency: 'CAD' },
              grossSalesMoney: { amount: '2000', currency: 'CAD' }
            }
          ],
          totalMoney: { amount: '2000', currency: 'CAD' }
        }
      })

      const requestBody = {
        currency: 'CAD',
        items: [
          {
            variationId: 'test-variation-id',
            quantity: 1,
            basePrice: 20,
            price: 20
          }
        ],
        locationId: 'test-location-id'
      }

      const request = new NextRequest('http://localhost:3000/api/calculate-order', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Response Structure', () => {
    it('should return order with lineItems for subtotal calculation', async () => {
      const { SquareClient } = require('square')
      const mockSquareClient = new SquareClient()
      mockSquareClient.orders.calculate.mockResolvedValue({
        order: {
          lineItems: [
            {
              catalogObjectId: 'test-variation-id',
              quantity: '1',
              basePriceMoney: { amount: '2000', currency: 'CAD' },
              grossSalesMoney: { amount: '2000', currency: 'CAD' }
            }
          ],
          totalMoney: { amount: '2000', currency: 'CAD' },
          totalDiscountMoney: { amount: '0', currency: 'CAD' }
        }
      })

      const requestBody = {
        currency: 'CAD',
        items: [
          {
            variationId: 'test-variation-id',
            quantity: 1,
            basePrice: 20,
            price: 20
          }
        ],
        locationId: 'test-location-id'
      }

      const request = new NextRequest('http://localhost:3000/api/calculate-order', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.order.lineItems).toBeDefined()
      expect(data.order.lineItems[0].basePriceMoney).toBeDefined()
      expect(data.order.lineItems[0].basePriceMoney.amount).toBe('2000')
    })
  })
})
