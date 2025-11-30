import { Square } from 'square';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface CartItem {
  product: Square.CatalogObjectItem;
  quantity: number;
  selectedVariation: Square.CatalogObjectItemVariation | null;
  basePrice?: number;
  price?: number;
}
