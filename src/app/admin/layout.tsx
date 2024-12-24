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
        <div className="min-h-screen bg-gray-100 overflow-x-hidden">
            {pathname !== '/admin/login' && (
                <nav className="bg-white shadow relative w-full">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row justify-between min-h-[64px]">
                            <div className="flex items-center justify-between w-full lg:w-auto py-4 lg:py-0">
                                <div className="flex items-center min-w-0">
                                    <Link
                                        href="/admin"
                                        className="text-lg font-semibold text-accent truncate"
                                    >
                                        Admin
                                    </Link>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="lg:hidden p-2 rounded-md hover:bg-gray-100 ml-2"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:flex flex-wrap items-center gap-2 pb-4 lg:pb-0`}>
                                <Link
                                    href="/admin/services"
                                    className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Services
                                </Link>
                                <Link
                                    href="/admin/addons"
                                    className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Add-ons
                                </Link>
                                <Link
                                    href="/admin/consent-forms"
                                    className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Consent Forms
                                </Link>
                                <Link
                                    href="/admin/staff"
                                    className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Staff
                                </Link>
                                <Link
                                    href="/admin/calendar"
                                    className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Calendar
                                </Link>
                                <Link
                                    href="/"
                                    className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Back to Site
                                </Link>
                                <button
                                    onClick={() => {
                                        Cookies.remove('adminToken', { path: '/' });
                                        router.push('/admin/login');
                                    }}
                                    className="block w-full lg:w-auto text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            )}
            <main className="w-full max-w-full">
                {children}
            </main>
        </div>
    );
}
