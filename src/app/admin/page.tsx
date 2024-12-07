'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/admin/services"
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2">Service Management</h2>
                    <p className="text-gray-600">
                        Manage your booking services, prices, and availability
                    </p>
                </Link>

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

                <Link
                    href="/admin/addons"
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2">Addon Management</h2>
                    <p className="text-gray-600">
                        Manage prices and availability of your addons for booking services.
                    </p>
                </Link>
            </div>
        </div>
    );
}
