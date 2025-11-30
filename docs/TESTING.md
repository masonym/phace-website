# Testing Documentation

This document outlines the testing framework implemented to prevent critical bugs in the storefront and booking flows.

## Overview

After experiencing several production bugs, we implemented a focused testing strategy to prevent similar issues. The testing approach prioritizes simplicity and effectiveness over complex frameworks.

## Recent Bugs Addressed

### 1. "Missing valid price data" Error
- **Issue**: Cart items with discounted products failed validation in Square payment API
- **Root Cause**: Cart items weren't passing `basePrice`/`price` fields to calculate-order API
- **Fix**: Added price validation in CartProvider and proper field mapping in API calls

### 2. Subtotal Showing $0.00
- **Issue**: Checkout subtotal displayed as $0.00 while discounts worked correctly
- **Root Cause**: Frontend was using non-existent `totalGrossSalesMoney` field instead of summing line items
- **Fix**: Changed subtotal calculation to sum `lineItems[].basePriceMoney.amount`

### 3. Pickup Fulfillment Error
- **Issue**: "A SCHEDULED pickup must have a pickup_at time" error for local pickup
- **Root Cause**: Missing `scheduleType: "ASAP"` and incorrect `recipient` field placement
- **Fix**: Added proper pickup fulfillment structure in square-payment API

## Testing Framework

### Simple Test Scripts (No Jest Complexity)

We chose simple Node.js test scripts over complex Jest setup for:
- Faster execution (milliseconds vs seconds)
- No complex configuration or dependency issues
- Easy to understand and maintain
- Can be run anywhere Node.js is available

### Test Files

#### 1. Cart Functions Test
**Location**: `scripts/test-cart-functions.js`

**Purpose**: Tests core cart logic that caused price validation bugs

**Test Coverage**:
- ✅ `getCartTotal()` calculation using stored price fields
- ✅ `addToCart()` validation (rejects zero/missing prices)
- ✅ Cart migration (filters invalid items from localStorage)
- ✅ Quantity updates for existing items

**Run Command**:
```bash
node scripts/test-cart-functions.js
```

#### 2. API Structure Test
**Location**: `scripts/test-api-structure.js`

**Purpose**: Tests API request/response structures that caused integration bugs

**Test Coverage**:
- ✅ Calculate-order API request includes required `basePrice`/`price` fields
- ✅ API response has `lineItems[].basePriceMoney` for subtotal calculation
- ✅ Pickup fulfillment structure with `scheduleType: "ASAP"`
- ✅ Shipping fulfillment structure with proper service charges
- ✅ Subtotal calculation logic matches Square API response format

**Run Command**:
```bash
node scripts/test-api-structure.js
```

## What These Tests Prevent

### 1. Price Data Validation Errors
- **Before**: Items with invalid prices could be added to cart, causing API failures
- **After**: Cart validation prevents invalid items from being added
- **Test Coverage**: Cart functions test validates price amount > 0 and exists

### 2. Subtotal Calculation Errors
- **Before**: Frontend used wrong API response field, showing $0.00
- **After**: Frontend sums line item base prices correctly
- **Test Coverage**: API structure test verifies response has correct fields

### 3. Fulfillment Structure Errors
- **Before**: Pickup orders had incorrect Square fulfillment structure
- **After**: Proper pickup fulfillment with required fields
- **Test Coverage**: API structure test validates fulfillment payload format

## Running Tests

### Local Development
```bash
# Test cart logic (price validation, subtotal calculation)
node scripts/test-cart-functions.js

# Test API structures (fulfillment, request/response format)
node scripts/test-api-structure.js

# Run all tests
npm run test:all
```

### CI/CD Integration
Add to your GitHub Actions workflow:

```yaml
- name: Run Critical Tests
  run: |
    node scripts/test-cart-functions.js
    node scripts/test-api-structure.js
```

## Test Maintenance

### Adding New Tests

1. **For new cart features**: Add to `scripts/test-cart-functions.js`
2. **For new API endpoints**: Add to `scripts/test-api-structure.js`
3. **For complex features**: Consider separate test script

### Test Structure Pattern

```javascript
function testFeatureName() {
  console.log('📋 Testing Feature Name')
  
  // Test data setup
  const testData = { /* ... */ }
  
  // Test execution
  const result = functionToTest(testData)
  
  // Validation
  if (result === expected) {
    console.log('✅ Feature works correctly')
    return true
  } else {
    console.log('❌ Feature has issues')
    return false
  }
}
```

### When to Add Tests

Add tests when you:
- Fix a bug (to prevent regression)
- Add new cart functionality
- Modify API request/response structure
- Change fulfillment logic
- Update price calculation logic

## Bug Prevention Checklist

Before deploying changes to cart or payment logic:

- [ ] Run `node scripts/test-cart-functions.js`
- [ ] Run `node scripts/test-api-structure.js`
- [ ] Test manually with discounted items
- [ ] Test both pickup and shipping fulfillment
- [ ] Verify subtotal calculation in checkout

## Debugging Guide

### If Cart Tests Fail
1. Check price validation logic in `CartProvider.tsx`
2. Verify `basePrice` and `price` are set correctly in `addToCart()`
3. Check cart migration logic in localStorage loading

### If API Tests Fail
1. Verify API request payloads include required fields
2. Check Square API response structure hasn't changed
3. Validate fulfillment structure matches Square's requirements
4. Ensure line items have proper price data

### Common Issues

**Issue**: Tests pass but production fails
- **Solution**: Check if test data matches real-world scenarios
- **Add**: More realistic test cases with actual product data

**Issue**: API structure test passes but subtotal is $0.00
- **Solution**: Verify frontend is using correct response field
- **Check**: Frontend subtotal calculation logic in Cart components

## Future Improvements

### Potential Enhancements
1. **End-to-End Tests**: Add Playwright tests for complete checkout flow
2. **Booking Flow Tests**: Similar tests for appointment booking functionality
3. **API Integration Tests**: Tests against actual development API endpoints
4. **Performance Tests**: Ensure cart operations remain fast with large carts

### Monitoring
Consider adding automated monitoring for:
- Cart validation failures
- API response structure changes
- Payment fulfillment errors
- Subtotal calculation discrepancies

## Conclusion

This testing framework focuses on preventing the specific bugs that caused production issues. By keeping tests simple and targeted, we ensure they remain maintainable and effective at catching regressions.

The philosophy is: **Test what broke, not what could break.** This approach provides maximum bug prevention with minimum maintenance overhead.
