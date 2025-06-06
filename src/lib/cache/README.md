# Booking System Caching Implementation

This directory contains the implementation of client-side caching for the booking system to reduce API calls and improve performance.

## Overview

The caching system uses localStorage to store booking-related data with appropriate expiration times based on data volatility:

- Categories: 15 minutes
- Services: 5 minutes
- Staff: 10 minutes
- Availability: 2 minutes

## Files

- `bookingCache.ts`: Core utility for caching with localStorage, including get/set/remove methods and specific helpers for booking data
- `BookingCacheContext.tsx`: React context provider for cache management and admin controls

## Components Updated

The following components have been updated to use the caching system:

1. `ServiceSelection.tsx`: Uses caching for categories and services
2. `StaffSelection.tsx`: Uses caching for staff members
3. `DateTimeSelection.tsx`: Uses caching for availability data

## Admin Cache Controls

For admin users, a cache control panel is available in the bottom-right corner of the booking page. This allows admins to:

- Clear specific caches (categories, services, staff, availability)
- Clear all caches at once

### Testing Admin Controls

To test the admin cache controls:

1. Set an admin cookie in your browser:
   - Open browser developer tools (F12)
   - Go to Application tab > Cookies
   - Add a cookie named `admin_user` with any value
   
2. Refresh the booking page
3. Look for the settings icon in the bottom-right corner
4. Click it to expand the cache control panel

## Cache Invalidation

The cache is automatically invalidated based on expiration times. For manual invalidation:

- Admins can use the cache control panel
- The cache is cleared when a booking is successfully created
- Individual caches are refreshed when their data might have changed

## Future Improvements

Potential future enhancements:

1. Server-side caching for API responses
2. HTTP caching headers for better browser caching
3. More granular cache invalidation based on data changes
4. Offline support using cached data
