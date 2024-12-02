import { Metadata } from 'next';
import ProductManager from '@/components/admin/ProductManager';

export const metadata: Metadata = {
    title: 'Product Management | Admin Dashboard',
    description: 'Manage your store products',
};

export default function ProductManagementPage() {
    return <ProductManager />;
}
