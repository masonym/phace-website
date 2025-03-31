import { SquareClient } from "square";

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
});

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    // imageUrl?: string; // Example optional field
}

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
    static async listProducts(category?: string): Promise<Product[]> {
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

            const products = itemsResult.items
                .filter(obj => obj.type === 'ITEM')
                .flatMap(item => {
                    if (!item.itemData?.variations) return [];

                    return item.itemData.variations
                        .filter(obj => obj.type === 'ITEM_VARIATION')
                        .map(variation => {
                            // check if variation has options
                            const options = (variation.itemVariationData?.itemOptionValues || [])
                                .reduce((acc, optValue) => {
                                    const option = itemOptions
                                        .filter(obj => obj.type === 'ITEM_OPTION')
                                        .find(opt => opt.id === optValue.itemOptionId);
                                    //if (option && option.itemOptionData?.name) {
                                    //    acc[option.itemOptionData.name] = optValue.!; // use the actual value name
                                    //}
                                    return acc;
                                }, {} as Record<string, string>);

                            const variationName = variation.itemVariationData?.name;
                            const productName = item.itemData?.name || "Unnamed";

                            return {
                                id: variation.id!,
                                name: variationName === "Regular" || !variationName ? productName : variationName,
                                price: this.safeNumber(variation.itemVariationData?.priceMoney?.amount ?? 0),
                                options
                            };
                        });
                });

            console.log("Products with options:", products);
            return products;

        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    }

}
