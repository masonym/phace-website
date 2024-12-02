import { Metadata } from 'next';
import OrderManager from '@/components/admin/OrderManager';

export const metadata: Metadata = {
    title: 'Order Management | Admin Dashboard',
    description: 'Manage customer orders',
};

export default function OrderManagementPage() {
    return <OrderManager />;
}
