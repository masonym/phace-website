export interface ProductColor {
    name: string;
    hex: string;
}

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    sku: string;
    inStock: boolean;
    color?: ProductColor;
}

export interface Product {
    id: string;
    name: string;
    description: string; // Markdown
    price: number;
    images: string[];
    category: string;
    sku: string;
    inStock: boolean;
    quantity?: number;
    variants?: ProductVariant[];
    whyWeLoveIt: string[]; // Markdown items
    howToUse: string[]; // Markdown items
    ingredients: string[]; // Markdown items
    colors?: ProductColor[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CartItem extends Product {
    quantity: number;
    selectedColor?: ProductColor;
}
