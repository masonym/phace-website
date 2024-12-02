import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Phace',
    description: 'Admin dashboard for managing products and orders',
};

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/admin/products"
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2">Product Management</h2>
                    <p className="text-gray-600">
                        Add, edit, or remove products from your store
                    </p>
                </Link>
                
                <Link
                    href="/admin/orders"
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2">Order Management</h2>
                    <p className="text-gray-600">
                        View and manage customer orders
                    </p>
                </Link>
            </div>
        </div>
    );
}
