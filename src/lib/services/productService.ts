import { SquareClient } from "square";
import { Square } from "square";

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
});

export class ProductService {

    /**
     * Helper function to safely convert BigInt values to numbers
     * @param value The value to convert
     */
    static safeNumber(value: number | bigint): number {
        if (typeof value === 'bigint') {
            return Number(value);
        }
        return value;
    }

    /**
     * Helper function to safely stringify objects with BigInt values
     * @param obj The object to stringify
     */
    static safeStringify(obj: any): string {
        return JSON.stringify(obj, (_, value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        }, 2);
    }

    /**
     * Fetch a list of products from Square
     */
    static async listProducts(category?: string): Promise<Square.CatalogObject[]> {
        try {
            // step 1: get products (ITEMs + ITEM_VARIATIONs)
            const itemsResult = await client.catalog.searchItems({ productTypes: ["REGULAR"] });
            if (!itemsResult.items) throw new Error("Failed to fetch products");

            console.log("Fetched items:", itemsResult.items);

            // step 2: get item options using search()
            const optionsResult = await client.catalog.search({
                objectTypes: ["ITEM_OPTION"],
                includeRelatedObjects: true,
                query: {
                    textQuery: { keywords: ["colour"] } // customize this
                }
            });

            const itemOptions = optionsResult.objects || [];
            console.log("Fetched options:", itemOptions);

            // step 3: build products with options
            const products: Square.CatalogObject[] = itemsResult.items
                .filter((item) => item.type === 'ITEM')
                .map((item) => {
                    return {
                        type: item.type,
                        id: item.id,
                        version: item.version !== undefined ? BigInt(item.version.toString()) : BigInt(0), // default to BigInt(0) if undefined
                        item_data: {
                            name: item.itemData?.name || "",
                            description: item.itemData?.description || "",
                            categories: item.itemData?.categories || [],
                            product_type: item.itemData?.productType || "REGULAR",
                            tax_ids: item.itemData?.taxIds || [],
                            variations: item.itemData?.variations || [],
                        },
                    };
                });

            // optionally filter by category if provided
            // this doesnt work
            //if (category) {
            //    return products.filter((product) =>
            //        product..categories.some((cat) => cat.name === category)
            //    );
            //}

            return products;
        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    }

    /**
     * Fetch a single product by ID
     */

    static async getProductById(productId: string): Promise<Square.Product | null> {
        try {
            const itemResult = await client.catalog.object.get({
                objectId: productId,
                includeRelatedObjects: true,
            });

            if (!itemResult.object) throw new Error("Product not found");

            const item = itemResult.object;

            if (item.type !== 'ITEM') {
                // This should never happen
                throw new Error("Catalog object is not a product");
            }

            const variations = item.itemData?.variations;

            if (!variations || variations.length === 0) {
                throw new Error("Product has no variations");
            }


            const itemData = { ...item.itemData, variations: variations.map(variation => { }) };

            return itemData;


        } catch (error) {
            console.error("Error fetching product:", error);
            throw error;
        }
    }

    static async getCategories(categoryIds: string[]): Promise<Square.CatalogObject[]> {
        try {
            const categories = await client.catalog.batchGet({
                objectIds: categoryIds,
                includeRelatedObjects: true,
            });

            if (!categories.objects) throw new Error("Categories not found");

            return categories.objects;
        } catch (error) {
            console.error("Error fetching categories:", error);
            throw error;
        }
    }
}
