import { parse } from 'csv-parse';
import fs from 'fs';
import { Product } from '../types/product';

export const importProductsFromCSV = async (filePath: string): Promise<Product[]> => {
    const products: Product[] = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true
            }))
            .on('data', (row: any) => {
                const product: Product = {
                    id: row.id || String(Math.random()),
                    name: row.name,
                    description: row.description,
                    price: parseFloat(row.price),
                    images: row.images ? row.images.split(',').map((img: string) => img.trim()) : [],
                    category: row.category,
                    sku: row.sku,
                    inStock: row.inStock === 'true' || row.inStock === true,
                    quantity: parseInt(row.quantity) || 0
                };
                products.push(product);
            })
            .on('end', () => {
                resolve(products);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};
