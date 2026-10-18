'use client';

import Link from 'next/link';
import { ADMIN_SECTIONS } from '@/lib/config/adminSections';

export default function AdminDashboard() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-gray-500">
                    Manage your bookings, store, and client experience from one place.
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ADMIN_SECTIONS.map(({ href, title, description, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className="group flex flex-col p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-accent/40 transition-all"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10 text-accent">
                                <Icon className="h-5 w-5" />
                            </span>
                            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-accent transition-colors">
                                {title}
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
