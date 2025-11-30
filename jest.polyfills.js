// Polyfills for Web APIs in Node.js environment
const { TextEncoder, TextDecoder } = require('util')

// Add Web API polyfills
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock fetch if not already mocked
if (!global.fetch) {
  global.fetch = jest.fn()
}
