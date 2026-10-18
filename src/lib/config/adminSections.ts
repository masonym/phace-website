import {
    CalendarDays,
    Users,
    Scissors,
    PlusCircle,
    FileText,
    Tag,
    ShoppingBag,
    ClipboardList,
    BellRing,
    type LucideIcon,
} from 'lucide-react';

export interface AdminSection {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
}

// Drives both the admin nav bar and the dashboard cards
export const ADMIN_SECTIONS: AdminSection[] = [
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
    {
        href: '/admin/product-waitlist',
        title: 'Product Waitlist',
        description: 'See who is waiting on "Coming Soon" products in the store.',
        icon: BellRing,
    },
];
