'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import WaitlistManager from '@/components/admin/WaitlistManager';

export default function WaitlistPage() {
    return (
        <AdminLayout>
            <div className="p-6">
                <WaitlistManager />
            </div>
        </AdminLayout>
    );
}