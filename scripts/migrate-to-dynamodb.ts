import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { ProductService } from '../src/lib/services/productService';

async function migrateProducts() {
    const csvPath = path.join(process.cwd(), 'public', 'data', 'products.csv');
    
    fs.createReadStream(csvPath)
        .pipe(parse({
            columns: true,
            skip_empty_lines: true
        }))
        .on('data', async (row: any) => {
            try {
                const product = {
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

                await ProductService.createProduct(product);
                console.log(`Migrated product: ${product.name}`);
            } catch (error) {
                console.error(`Failed to migrate product: ${row.name}`, error);
            }
        })
        .on('end', () => {
            console.log('Migration completed');
        })
        .on('error', (error) => {
            console.error('Migration failed:', error);
        });
}

migrateProducts().catch(console.error);
