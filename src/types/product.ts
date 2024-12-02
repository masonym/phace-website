export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    sku: string;
    inStock: boolean;
    quantity?: number;
    variants?: ProductVariant[];
}

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    sku: string;
    inStock: boolean;
}
