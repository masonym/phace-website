'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import ProductWaitlistManager from '@/components/admin/ProductWaitlistManager';

export default function ProductWaitlistPage() {
    return (
        <AdminLayout>
            <div className="p-6">
                <ProductWaitlistManager />
            </div>
        </AdminLayout>
    );
}
