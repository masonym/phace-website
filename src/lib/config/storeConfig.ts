/**
 * Store configuration.
 *
 * HIDDEN_CATEGORY_IDS: Square category IDs whose products should be hidden
 * from the storefront. Any product belonging to one of these categories is
 * filtered out server-side in ProductService.listProducts(), so it never
 * reaches the /api/products response or the /store page.
 *
 * To find a category ID: open the category in Square, or inspect the
 * `categories[].id` values returned by /api/products.
 */
export const HIDDEN_CATEGORY_IDS: string[] = [
    // 'EXAMPLE_CATEGORY_ID',
    "I3UFN36WO3SYONZM2GUJVLRD", // Paz Retail
];
