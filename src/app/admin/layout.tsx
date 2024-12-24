'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import './admin.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div className="min-h-screen bg-gray-100">
            {pathname !== '/admin/login' && (
                <nav className="bg-white shadow">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between min-h-[64px]">
                            <div className="flex items-center justify-between py-4 md:py-0">
                                <Link
                                    href="/admin"
                                    className="flex items-center text-lg font-semibold"
                                >
                                    Admin Dashboard
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 rounded-md hover:bg-gray-100"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 pb-4 md:pb-0`}>
                                <Link
                                    href="/admin/services"
                                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Services
                                </Link>
                                <Link
                                    href="/admin/waitlist"
                                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Waitlist
                                </Link>
                                <Link
                                    href="/admin/products"
                                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/admin/orders"
                                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Orders
                                </Link>
                                <Link
                                    href="/"
                                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                                >
                                    Back to Site
                                </Link>
                                <button
                                    onClick={() => {
                                        Cookies.remove('adminToken', { path: '/' });
                                        router.push('/admin/login');
                                    }}
                                    className="px-3 py-2 rounded-md hover:bg-gray-100 text-red-600 text-left"
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
