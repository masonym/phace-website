'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Skip auth check for login page
        if (pathname === '/admin/login') {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
        }

        // Check if user is admin
        const checkAuth = async () => {
            try {
                const token = Cookies.get('adminToken');
                if (!token) {
                    throw new Error('No token found');
                }

                const response = await fetch('/api/admin/auth', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw new Error('Invalid token');
                }

                setIsAuthorized(true);
            } catch (error) {
                Cookies.remove('adminToken', { path: '/' });
                router.push('/admin/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!isAuthorized && pathname !== '/admin/login') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {pathname !== '/admin/login' && (
                <nav className="bg-white shadow">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <Link
                                    href="/admin"
                                    className="flex items-center px-4 text-lg font-semibold"
                                >
                                    Admin Dashboard
                                </Link>
                            </div>
                            <div className="flex space-x-4">
                                <Link
                                    href="/admin/services"
                                    className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Services
                                </Link>
                                <Link
                                    href="/admin/waitlist"
                                    className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Waitlist
                                </Link>
                                <Link
                                    href="/admin/products"
                                    className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/admin/orders"
                                    className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Orders
                                </Link>
                                <Link
                                    href="/"
                                    className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Back to Site
                                </Link>
                                <button
                                    onClick={() => {
                                        Cookies.remove('adminToken', { path: '/' });
                                        router.push('/admin/login');
                                    }}
                                    className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 text-red-600"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            )}
            <main className="container mx-auto py-6 px-4">{children}</main>
        </div>
    );
}
