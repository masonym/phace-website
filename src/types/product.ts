export interface ProductColor {
    name: string;
    hex: string;
}

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
    whyWeLoveIt: string[];
    howToUse: string[];
    ingredients: string[];
    colors?: ProductColor[];
}

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    sku: string;
    inStock: boolean;
    color?: ProductColor;
}

export interface CartItem extends Product {
    quantity: number;
    selectedColor?: ProductColor;
}
