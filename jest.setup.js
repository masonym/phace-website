import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID = 'test-location-id'
process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID = 'test-app-id'
process.env.SQUARE_ACCESS_TOKEN = 'test-token'
process.env.SQUARE_ENVIRONMENT = 'sandbox'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()
