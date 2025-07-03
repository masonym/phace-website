/**
 * Configuration for booking addons
 */

// Categories that should skip the addon step entirely
export const CATEGORIES_WITHOUT_ADDONS: string[] = [
  // Add category IDs here
  // Example: "ABCDEF123456"
  "GC6LPGDPADKMBEGLYV4VPHOJ"
];

// Service-specific addon mappings
// If a service is not in this map, it will show all available addons
// If a service has an empty array, it will show no addons
export const SERVICE_ADDON_MAP: Record<string, string[]> = {
  // Map service IDs to arrays of addon IDs
  // Example: "SERVICE_ID": ["ADDON_ID1", "ADDON_ID2"]
};

// Category-level addon mappings (applies to all services in that category)
// This is a fallback if a specific service mapping isn't defined
export const CATEGORY_ADDON_MAP: Record<string, string[]> = {
  // Map category IDs to arrays of addon IDs
  // Example: "CATEGORY_ID": ["ADDON_ID1", "ADDON_ID2"]
};
