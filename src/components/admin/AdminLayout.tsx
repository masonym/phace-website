'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { createContext, useContext } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MobileMenuContextType {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const MobileMenuContext = createContext<MobileMenuContextType>({
  mobileMenuOpen: false,
  setMobileMenuOpen: () => { },
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const adminToken = Cookies.get('adminToken');
    if (!isLoading && (!isAuthenticated || !isAdmin || !adminToken)) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const adminToken = Cookies.get('adminToken');
  if (!isAuthenticated || !isAdmin || !adminToken) {
    return null;
  }

  return (
    <MobileMenuContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen } as MobileMenuContextType}>
      <div className="min-h-screen py-6 px-4 bg-gray-100 overflow-x-hidden">
        {/* Navigation */}
        <nav className="bg-white shadow-sm relative">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row justify-between min-h-[64px]">
              <div className="flex items-center justify-between w-full lg:w-auto py-4 lg:py-0">
                {/* Logo */}
                <div className="flex items-center min-w-0">
                  <Link href="/admin" className="text-xl font-bold text-accent truncate">
                    Admin
                  </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex items-center lg:hidden ml-2">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    <span className="sr-only">Open main menu</span>
                    {mobileMenuOpen ? (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="hidden lg:flex flex-wrap items-center gap-2">
                {/* Navigation Links */}
                <Link
                  href="/admin/services"
                  className="border-transparent text-gray-500 hover:border-accent hover:text-accent inline-flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Services
                </Link>
                <Link
                  href="/admin/addons"
                  className="border-transparent text-gray-500 hover:border-accent hover:text-accent inline-flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Add-ons
                </Link>
                <Link
                  href="/admin/consent-forms"
                  className="border-transparent text-gray-500 hover:border-accent hover:text-accent inline-flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Consent Forms
                </Link>
                <Link
                  href="/admin/staff"
                  className="border-transparent text-gray-500 hover:border-accent hover:text-accent inline-flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Staff
                </Link>
                <Link
                  href="/admin/calendar"
                  className="border-transparent text-gray-500 hover:border-accent hover:text-accent inline-flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Calendar
                </Link>
                <Link
                  href="/admin/waitlist"
                  className="border-transparent text-gray-500 hover:border-accent hover:text-accent inline-flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Waitlist Manager
                </Link>

                {/* Desktop sign out button */}
                <button
                  onClick={() => {
                    Cookies.remove('adminToken', { path: '/' });
                    signOut();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 whitespace-nowrap"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden`}>
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/admin/services"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-accent hover:bg-gray-50 whitespace-nowrap"
              >
                Services
              </Link>
              <Link
                href="/admin/addons"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-accent hover:bg-gray-50 whitespace-nowrap"
              >
                Add-ons
              </Link>
              <Link
                href="/admin/consent-forms"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-accent hover:bg-gray-50 whitespace-nowrap"
              >
                Consent Forms
              </Link>
              <Link
                href="/admin/staff"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-accent hover:bg-gray-50 whitespace-nowrap"
              >
                Staff
              </Link>
              <Link
                href="/admin/calendar"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-accent hover:bg-gray-50 whitespace-nowrap"
              >
                Calendar
              </Link>
              <Link
                href="/admin/waitlist"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-accent hover:bg-gray-50 whitespace-nowrap"
              >
                Waitlist Manager
              </Link>
              <button
                onClick={() => {
                  Cookies.remove('adminToken', { path: '/' });
                  signOut();
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-accent hover:bg-gray-50 whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="w-full max-w-full">
          {children}
        </main>
      </div>
    </MobileMenuContext.Provider>
  );
}
