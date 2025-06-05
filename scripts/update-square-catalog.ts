import { SquareClient, SquareEnvironment } from 'square';


import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Type definitions for Square SDK v41
type CatalogItemData = {
  name?: string;
  description?: string;
  categoryId?: string;
  variations?: Array<{
    id: string;
    type: string;
    version?: number | bigint;
    itemVariationData?: {
      name?: string;
      priceMoney?: {
        amount?: number | bigint;
      };
      serviceDuration?: number | bigint;
      availableForBooking?: boolean;
    };
  }>;
};

type CatalogObject = {
  id: string;
  type: string;
  version?: number | bigint;
  itemData?: CatalogItemData;
  itemVariationData?: {
    name?: string;
    priceMoney?: {
      amount?: number | bigint;
    };
    serviceDuration?: number | bigint;
    availableForBooking?: boolean;
  };
};

/**
 * Helper function to safely stringify objects with BigInt values
 */
function safeStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, 2);
}

/**
 * Helper function to safely convert BigInt values to numbers
 */
function safeNumber(value: number | bigint): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
}

/**
 * Updates all catalog items with product type APPOINTMENTS_SERVICE
 * to set available_for_booking to false for all item variations
 */
async function updateCatalogItems() {
  try {
    console.log("Initializing Square client...");
    console.log("Using token:", process.env.SQUARE_ACCESS_TOKEN! ? "[Token exists]" : "[Token missing]");
    console.log("Environment:", process.env.SQUARE_ENVIRONMENT || "Not set (defaulting to sandbox)");
    
    // Initialize Square client with SDK v41 structure
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.SQUARE_ENVIRONMENT === "production" 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox
    });
    
    console.log("Searching for appointment service catalog items...");
    
    // Search for all catalog items with product type APPOINTMENTS_SERVICE
    const searchResult = await client.catalog.searchItems({
      productTypes: ["APPOINTMENTS_SERVICE"]
    });
    
    if (!searchResult.items || searchResult.items.length === 0) {
      console.log("No appointment service catalog items found.");
      return;
    }
    
    console.log(`Found ${searchResult.items.length} appointment service catalog items.`);
    
    // Process each item
    for (const item of searchResult.items) {
      try {
        // Use type assertion to handle TypeScript definition issues
        console.log(`Processing item: ${item.id} - ${(item as any).itemData?.name || 'Unknown'}`);
        
        // Get the full catalog object to ensure we have all the data
        const itemResult = await client.catalog.object.get({
          // @ts-ignore
          objectId: item.id,
          includeRelatedObjects: true
        });
        
        if (!itemResult.object) {
          console.log(`Could not retrieve full details for item ${item.id}`);
          continue;
        }
        
        const catalogObject = itemResult.object;
        
        // Skip if not an item or has no variations
        const typedCatalogObject = catalogObject as unknown as CatalogObject;
        if (typedCatalogObject.type !== 'ITEM' || 
            !typedCatalogObject.itemData?.variations || 
            typedCatalogObject.itemData.variations.length === 0) {
          console.log(`Skipping item ${item.id} - not a valid item with variations`);
          continue;
        }
        
        // Process each variation
        for (const variation of (catalogObject as any).itemData.variations) {
          try {
            console.log(`Updating variation: ${variation.id}`);
            
            // Create updated variation object
            const updatedVariation = {
              type: 'ITEM_VARIATION',
              id: variation.id,
              version: variation.version,
              itemVariationData: {
                ...variation.itemVariationData,
                availableForBooking: false
              }
            };
            
            try {
              // Update the variation
              // @ts-ignore - Square SDK v41 method exists but TypeScript definition is incorrect
              const updateResult = await client.catalog.object.upsert({
                idempotencyKey: `update-booking-${variation.id}-${Date.now()}`,
                // @ts-ignore
                object: updatedVariation
              });
              
              console.log(`Successfully updated variation ${variation.id}`);
            } catch (upsertError: any) {
              // Check if this is the specific error about item not being enabled
              if (upsertError.status === 400 && 
                  upsertError.errors && 
                  upsertError.errors.some((e: any) => 
                    e.code === 'INVALID_VALUE' && 
                    e.detail && 
                    e.detail.includes('is enabled at unit') && 
                    e.detail.includes('but the referenced object') && 
                    e.detail.includes('is not')
                  )) {
                console.log(`Skipping variation ${variation.id} - Parent item is not enabled at the same location as the variation`);
              } else {
                // Re-throw other errors
                throw upsertError;
              }
            }
          } catch (variationError: any) {
            console.error(`Error updating variation ${variation.id}:`, variationError.message || variationError);
            if (variationError.errors) {
              console.error('API Error Details:', JSON.stringify(variationError.errors));
            }
          }
        }
        
        console.log(`Completed processing item: ${item.id}`);
      } catch (itemError: any) {
        console.error(`Error processing item ${item.id}:`, itemError.message || itemError);
      }
    }
    
    console.log("Catalog update process completed.");
  } catch (error: any) {
    console.error("Error updating catalog items:", error.message || error);
  }
}

// Run the update function
updateCatalogItems()
  .then(() => console.log("Script execution completed."))
  .catch(err => console.error("Script execution failed:", err))
  .finally(() => process.exit());
