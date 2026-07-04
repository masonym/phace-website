'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
    CalendarDays,
    Users,
    Scissors,
    PlusCircle,
    FileText,
    Tag,
    ShoppingBag,
    ClipboardList,
    type LucideIcon,
} from 'lucide-react';

interface AdminSection {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
}

const sections: AdminSection[] = [
    {
        href: '/admin/calendar',
        title: 'Calendar',
        description: 'View and manage the appointment schedule across all staff members.',
        icon: CalendarDays,
    },
    {
        href: '/admin/services',
        title: 'Services',
        description: 'Manage your booking services, prices, and availability.',
        icon: Scissors,
    },
    {
        href: '/admin/addons',
        title: 'Add-ons',
        description: 'Manage prices and availability of add-ons for booking services.',
        icon: PlusCircle,
    },
    {
        href: '/admin/staff',
        title: 'Staff',
        description: 'Manage staff members, their schedules, and assigned services.',
        icon: Users,
    },
    {
        href: '/admin/consent-forms',
        title: 'Consent Forms',
        description: 'Create and manage consent forms and review client responses.',
        icon: FileText,
    },
    {
        href: '/admin/discounts',
        title: 'Discounts',
        description: 'Create and manage promotional codes and automatic discounts.',
        icon: Tag,
    },
    {
        href: '/admin/orders',
        title: 'Orders',
        description: 'View and manage customer orders from your store.',
        icon: ShoppingBag,
    },
    {
        href: '/admin/waitlist',
        title: 'Waitlist',
        description: 'View and manage customer waitlist entries by service and staff member.',
        icon: ClipboardList,
    },
];

export default function AdminDashboard() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-lg text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-gray-500">
                    Manage your bookings, store, and client experience from one place.
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map(({ href, title, description, icon: Icon }) => (
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
