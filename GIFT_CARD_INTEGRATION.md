# Christmas Gift Card Lightbox Integration Guide

## Overview
A responsive, accessible gift card promotion lightbox for Christmas holiday specials with two tiers:
- $100 gift card → $150 value (2× $25 bonus cards)
- $200 gift card → $300 value (4× $25 bonus cards)

## ⚠️ IMPORTANT: Pre-Deployment Verification Required

**BEFORE PRODUCTION DEPLOYMENT, you must:**
1. Test the component at `/test-gift-card` to verify it renders without errors
2. Confirm all interactions work (escape key, backdrop click, keyboard navigation)
3. Verify responsive design on mobile devices
4. **TEST SQUARE URL**: Visit https://squareup.com/gift/MLQZQRE5MYB56/order and confirm customers can select $100 and $200 amounts
5. Confirm bonus card delivery timeline with business team (currently set to "24-48 hours" - needs verification)

## Files Created
```
src/components/promotions/
├── GiftCardLightbox.tsx    # Main modal component
├── GiftCardPromoButton.tsx # Trigger button
└── index.ts               # Export file

src/app/test-gift-card/
└── page.tsx               # Test page for verification
```

## Quick Integration

### 1. Import the Component
```tsx
import { GiftCardPromoButton } from '@/components/promotions';
```

### 2. Add to Your Page
```tsx
export default function YourPage() {
  return (
    <div>
      {/* Your existing content */}
      
      {/* Add this where you want the trigger button */}
      <div className="flex justify-center py-8">
        <GiftCardPromoButton />
      </div>
    </div>
  );
}
```

## Recommended Placement Options

### Option 1: Homepage Hero Section
```tsx
// In homepage hero, below main CTA
<div className="mt-8 flex justify-center">
  <GiftCardPromoButton />
</div>
```

### Option 2: Navigation Bar
```tsx
// In Navigation.tsx, alongside other nav items
<div className="hidden md:flex items-center gap-4">
  {/* existing nav items */}
  <GiftCardPromoButton />
</div>
```

### Option 3: Footer Banner
```tsx
// In Footer.tsx, as a prominent call-to-action
<div className="bg-gradient-to-r from-green-50 to-red-50 p-6 border-t">
  <div className="max-w-6xl mx-auto text-center">
    <GiftCardPromoButton />
  </div>
</div>
```

### Option 4: Floating Button (Mobile)
```tsx
// Add to shared layout for mobile-only floating button
<div className="md:hidden fixed bottom-4 right-4 z-40">
  <GiftCardPromoButton />
</div>
```

## Features
- ✅ Fully responsive (desktop/mobile)
- ✅ Accessible (ARIA labels, keyboard navigation, screen reader)
- ✅ Escape key and backdrop click to close
- ✅ Focus trap within modal
- ✅ Body scroll lock when open
- ✅ Holiday theming with brand consistency
- ✅ Links to Square gift card purchase
- ✅ Clear promotion terms and restrictions

## Testing
Visit `/test-gift-card` to verify functionality:
- Modal opens/closes properly
- Keyboard navigation works (Tab, Shift+Tab, Escape)
- Responsive design on mobile
- Links open in new tabs
- Accessibility features

## Client Notes
- **Bonus cards**: Will be emailed separately within 24-48 hours
- **Restrictions**: Only one bonus card per transaction, not valid for naturopath/IV/nail services
- **Square URL**: Both options link to same Square page where customers select amount

## Promotion Management
To disable the promotion temporarily:
```tsx
// Comment out or remove the button
// <GiftCardPromoButton />
```

Or wrap with a condition:
```tsx
const isHolidayPromotionActive = false; // Set to false to disable

{isHolidayPromotionActive && <GiftCardPromoButton />}
```

## Support
For questions or issues with the integration, test the component at `/test-gift-card` first to verify basic functionality.
