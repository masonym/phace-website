import { Product, ProductColor } from './product';

export interface CartItem {
    product: Product;
    quantity: number;
    selectedColor: ProductColor | null;
}
