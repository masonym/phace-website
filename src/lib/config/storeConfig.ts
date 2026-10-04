/**
 * Store configuration.
 *
 * HIDDEN_CATEGORY_IDS: Square category IDs whose products should be hidden
 * from the storefront. Any product belonging to one of these categories is
 * filtered out server-side in ProductService.listProducts(), so it never
 * reaches the /api/products response or the /store page. These categories
 * are also hidden from the category list on the /book page.
 *
 * To find a category ID: open the category in Square, or inspect the
 * `categories[].id` values returned by /api/products.
 */
export const HIDDEN_CATEGORY_IDS: string[] = [
    // 'EXAMPLE_CATEGORY_ID',
    "I3UFN36WO3SYONZM2GUJVLRD", // Paz Retail
    "JOCFMCTA5Y7B2PRPIWMST26F", // Link Only (items sold via Square payment links, not the storefront)
];

/**
 * Store filter grouping.
 *
 * Preferred: in Square, put brand categories under a parent category named "Brands".
 * Those are listed under "Filter by Brand" and everything else under "Browse by Type".
 *
 * Until that exists, categories whose name contains one of these brand names are treated as brands.
 */
export const BRAND_PARENT_CATEGORY_NAMES = ['brands', 'brand', 'shop by brand'];

export const BRAND_NAME_FALLBACK: string[] = [
    "Aphina",
    "G.M. Collin",
    "Kala",
    "DMK",
    "Elle Hall",
    "Mifa",
    "Is Clinical",
    "Alumier",
    "Beautifi",
    "Bion",
    "Botanical Skincare",
    "Celluma",
    "Cheekbone",
    "Clarion",
    "ClearChoice",
    "ColorScience",
    "Colorescience",
    "DermaSpark",
    "DP4",
    "Freezpen",
    "Jessica",
    "Pura",
    "See You Sundae",
    "Sharplight",
    "Tizo",
    "Zena",
    "Phace",
    "Bushbalm",
];
