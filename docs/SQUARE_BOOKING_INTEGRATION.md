# Square Booking Integration

This document outlines how the Phace website integrates with Square's Booking and Catalog APIs to manage services, staff, and appointments.

## Overview

The website now uses Square as the source of truth for:

1. **Services** - Stored as catalog items in Square with appointment-specific details
2. **Staff Members** - Managed through Square's Team API and Booking Profiles
3. **Appointments** - Created and managed through Square's Booking API

This integration replaces the previous DynamoDB-based booking system, providing a unified experience where all business data is managed in one place (Square).

## Key Components

### 1. Square Booking Service

The `squareBookingService.ts` file provides methods to interact with Square's APIs:

- **Service Management**: Fetch services and categories from Square's Catalog
- **Staff Management**: Get staff members and their availability from Square's Team API
- **Appointment Scheduling**: Create and manage appointments using Square's Booking API

### 2. API Endpoints

The following API endpoints have been updated to use Square:

- `/api/booking/services` - Fetches services from Square's Catalog
- `/api/booking/staff` - Gets staff members from Square's Team API
- `/api/booking/appointments` - Creates and manages appointments in Square
- `/api/booking/availability` - Checks staff availability using Square's Booking API

### 3. Data Flow

1. **Service Data**: Pulled from Square Catalog, where services are set up as items with appointment-specific attributes
2. **Staff Data**: Pulled from Square Team Members with booking profiles
3. **Availability**: Calculated using Square's availability search
4. **Appointments**: Created in Square, which handles notifications, calendar integration, etc.

## Setup Requirements

To use this integration, you need:

1. A Square account with Appointments Plus or Premium subscription
2. Services set up in Square's Catalog
3. Staff members set up in Square with booking profiles
4. The following environment variables:
   - `SQUARE_ACCESS_TOKEN` - Your Square API access token
   - `NEXT_PUBLIC_SQUARE_APPLICATION_ID` - Your Square application ID
   - `NEXT_PUBLIC_SQUARE_LOCATION_ID` - Your Square location ID

## Managing Data

All service, staff, and appointment data should now be managed through Square's dashboard:

1. **Adding/Editing Services**: Use Square's Catalog management
2. **Managing Staff**: Use Square's Team management
3. **Setting Availability**: Configure through Square's Appointments settings
4. **Viewing Appointments**: Use Square's Appointments dashboard

The website will automatically reflect any changes made in Square.

## Benefits

1. **Unified System**: All business data (payments, inventory, appointments) in one place
2. **Reduced Maintenance**: No need to maintain separate booking database
3. **Better Features**: Leverage Square's appointment features (reminders, confirmations, etc.)
4. **Improved Reporting**: Unified reporting for services and payments

## Performance Optimizations

### Caching Strategy

To avoid excessive API calls to Square and prevent rate limiting, the `squareBookingService.ts` implements the following caching strategies:

1. **Service Category Caching**: Service categories are loaded upfront since there are typically only a few categories.

2. **Service Caching**: 
   - Services are cached by category ID with a 5-minute expiration
   - Services are only loaded when a specific category is selected, not all at once
   - The `getServicesByCategory` method checks the cache before making API calls
   - The `getServiceById` method checks all category caches before making an API call

3. **Cache Management**:
   - `clearServicesCache` method allows clearing the cache for a specific category or all categories
   - Cache entries include a timestamp to implement time-based expiration

### Usage Guidelines

To maintain optimal performance:

1. Only load services when a category is selected by the user
2. Avoid loading all services at once across all categories
3. Consider clearing the cache when data might be stale (e.g., after a long period of inactivity)

## Technical Notes

- The Square Bookings API requires specific OAuth scopes for full functionality
- Staff members must have booking profiles set up in Square to be available for appointments
- Services must be set up as appointment-enabled catalog items
- Square handles notifications to customers and staff automatically
