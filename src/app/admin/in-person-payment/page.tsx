'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InPersonPaymentForm from '@/components/admin/InPersonPaymentForm';
import AdminLayout from '@/components/admin/AdminLayout';

export default function InPersonPaymentPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is admin
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
      router.push('/login?redirect=/admin/in-person-payment');
      return;
    }
    
    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return <div className="container mx-auto px-4 py-8 pt-32">Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">In-Person Payment</h1>
        <div className="max-w-2xl mx-auto">
          <InPersonPaymentForm />
        </div>
      </div>
    </AdminLayout>
  );
}
