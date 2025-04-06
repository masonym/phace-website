import { Square } from "square";
import { SquareClient, SquareEnvironment } from "square";

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === "production"
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
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

            //console.log("Fetched items:", itemsResult.items);

            // step 2: get item options using search()
            const optionsResult = await client.catalog.search({
                objectTypes: ["ITEM_OPTION"],
                includeRelatedObjects: true,
                query: {
                    textQuery: { keywords: ["colour"] } // customize this
                }
            });

            const itemOptions = optionsResult.objects || [];
            //console.log("Fetched options:", itemOptions);

            // step 3: build products with options
            const products: Square.CatalogObject[] = itemsResult.items
                .filter((item) => item.type === 'ITEM')
                .map((item) => {
                    return {
                        type: item.type,
                        id: item.id,
                        version: item.version !== undefined ? BigInt(item.version.toString()) : BigInt(0), // default to BigInt(0) if undefined
                        itemData: {
                            ...item.itemData,
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

    static async getProductById(productId: string): Promise<Square.CatalogObjectItem> {
        try {
            const itemResult = await client.catalog.object.get({
                objectId: productId,
                includeRelatedObjects: true,
            });

            if (!itemResult.object) throw new Error("Product not found");

            let applicableDiscount;
            for (const discount of discounts) {
                if (discount.productIds.includes(productId)) {
                    applicableDiscount = {
                        discountType: discount.discountType,
                        amount: discount.amount,
                        percentage: discount.percentage,
                    };
                    break;
                }
            }

            const item = itemResult.object;

            if (item.type !== 'ITEM') {
                throw new Error("Catalog object is not a product");
            }

            const variations = item.itemData?.variations;

            if (!variations || variations.length === 0) {
                throw new Error("Product has no variations");
            }

            return {
                type: item.type,
                id: item.id,
                updatedAt: item.updatedAt,
                version: item.version,
                isDeleted: item.isDeleted,
                presentAtAllLocations: item.presentAtAllLocations,
                itemData: {
                    ...item.itemData,
                    variations: variations
                        .filter(variation => variation.type === 'ITEM_VARIATION')
                        .map(variation => ({
                            ...variation,
                            itemVariationData: variation.itemVariationData,
                        })),
                },
            } as Square.CatalogObjectItem;
        } catch (error) {
            console.error("Error fetching product:", error);
            throw error;
        }
    }

    static async getCategories(categoryIds: string[]): Promise<Square.CatalogObject[]> {
        try {
            console.log("Fetching categories:", categoryIds);
            const categories = await client.catalog.batchGet({
                objectIds: categoryIds,
                includeRelatedObjects: true,
            });

            if (!categories.objects) throw new Error("Categories not found");

            console.log(categories.objects);
            return categories.objects;
        } catch (error) {
            console.error("Error fetching categories:", error);
            throw error;
        }
    }

    static async getDiscountData(): Promise<any[]> {
        try {
            const discountsResult = await client.catalog.search({
                objectTypes: ["PRICING_RULE"],
                includeRelatedObjects: true,
            });

            if (!discountsResult.relatedObjects) throw new Error("Failed to fetch discounts");

            let productSet = discountsResult.relatedObjects
                .filter((object) => object.type === 'PRODUCT_SET')
                .map((object => ({
                    productIds: object.productSetData?.productIdsAny || [],
                    id: object.id,
                })));

            let discountData = discountsResult.relatedObjects
                .filter((discount) => discount.type === 'DISCOUNT')
                .map((discount) => ({
                    id: discount.id,
                    discountType: discount.discountData?.discountType,
                    amount: discount.discountData?.amountMoney?.amount,
                    percentage: discount.discountData?.percentage,
                }));

            return discountData;
        } catch (error) {
            console.error("Error fetching discounts:", error);
            throw error;
        }
    }
}
