'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getFreshIdToken } from '@/lib/auth/clientSession';
import { ADMIN_SECTIONS } from '@/lib/config/adminSections';
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
    const { signOut } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        setMobileMenuOpen(false);

        if (isLoginPage) {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
        }

        // Re-checked on every admin navigation, which also keeps the token fresh
        const checkAuth = async () => {
            try {
                const token = await getFreshIdToken();
                if (!token) {
                    throw new Error('No session');
                }

                const response = await fetch('/api/admin/auth', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw new Error('Not an admin');
                }

                setIsAuthorized(true);
            } catch {
                setIsAuthorized(false);
                router.replace('/admin/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, isLoginPage, router]);

    const handleSignOut = () => {
        signOut();
        router.push('/admin/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    const linkClass = (href: string) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return `block px-3 py-2 rounded-md whitespace-nowrap ${isActive
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-gray-700 hover:bg-gray-100'
            }`;
    };

    return (
        <div className="min-h-screen bg-gray-100 overflow-x-hidden">
            {!isLoginPage && (
                <nav className="bg-white shadow relative w-full">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between min-h-[64px]">
                            <div className="flex items-center justify-between w-full lg:w-auto py-4 lg:py-0">
                                <Link
                                    href="/admin"
                                    className="text-lg font-semibold text-accent truncate"
                                >
                                    Admin
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    aria-expanded={mobileMenuOpen}
                                    aria-controls="admin-nav-links"
                                    className="lg:hidden p-2 rounded-md hover:bg-gray-100 ml-2"
                                >
                                    <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {mobileMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                            <div
                                id="admin-nav-links"
                                className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:flex flex-wrap items-center gap-1 pb-4 lg:pb-0`}
                            >
                                {ADMIN_SECTIONS.map(({ href, title }) => (
                                    <Link key={href} href={href} className={linkClass(href)}>
                                        {title}
                                    </Link>
                                ))}
                                <Link
                                    href="/"
                                    className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Back to Site
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="block w-full lg:w-auto text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 whitespace-nowrap"
                                >
                                    Sign Out
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
