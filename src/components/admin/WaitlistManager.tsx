'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { showToast } from '@/components/ui/Toast';
import { Loader2 } from "lucide-react";

interface WaitlistEntry {
    id: string;
    serviceId: string;
    serviceName: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    preferredDates: string[];
    preferredStaffIds: string[];
    preferredStaffNames?: string[];
    status: 'active' | 'contacted' | 'booked' | 'expired';
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

interface StaffMember {
    id: string;
    name: string;
}

export default function WaitlistManager() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'active' | 'contacted' | 'booked' | 'expired'>('active');
    const [staffFilter, setStaffFilter] = useState<string>('');

    const fetchStaffMembers = async () => {
        try {
            const response = await fetch('/api/admin/staff');
            if (!response.ok) throw new Error('Failed to fetch staff members');
            const data = await response.json();
            setStaffMembers(data);
        } catch (error) {
            showToast({
                title: 'Error',
                description: 'Failed to fetch staff members',
                status: 'error',
            });
        }
    };

    const fetchEntries = async () => {
        try {
            const params = new URLSearchParams({ status: statusFilter });
            if (staffFilter) {
                params.append('staffId', staffFilter);
            }
            const response = await fetch(`/api/admin/waitlist?${params}`);
            if (!response.ok) throw new Error('Failed to fetch waitlist entries');
            const data = await response.json();
            setEntries(data);
        } catch (error) {
            showToast({
                title: 'Error',
                description: 'Failed to fetch waitlist entries',
                status: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffMembers();
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [statusFilter, staffFilter]);

    const updateStatus = async (id: string, newStatus: 'active' | 'contacted' | 'booked' | 'expired', notes?: string) => {
        try {
            const response = await fetch('/api/admin/waitlist', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, status: newStatus, notes }),
            });

            if (!response.ok) throw new Error('Failed to update status');

            showToast({
                title: 'Success',
                description: 'Waitlist entry status updated',
                status: 'success',
            });

            fetchEntries();
        } catch (error) {
            showToast({
                title: 'Error',
                description: 'Failed to update status',
                status: 'error',
            });
        }
    };

    const deleteEntry = async (id: string) => {
        if (!confirm('Are you sure you want to delete this waitlist entry?')) return;

        try {
            const response = await fetch(`/api/admin/waitlist?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete entry');

            showToast({
                title: 'Success',
                description: 'Waitlist entry deleted',
                status: 'success',
            });

            fetchEntries();
        } catch (error) {
            showToast({
                title: 'Error',
                description: 'Failed to delete entry',
                status: 'error',
            });
        }
    };

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold">Waitlist Management</h1>
                <div className="flex gap-4">
                    <select
                        value={staffFilter}
                        onChange={(e) => setStaffFilter(e.target.value)}
                        className="px-4 py-2 border rounded-md"
                    >
                        <option value="">All Staff</option>
                        {staffMembers.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                                {staff.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border rounded-md"
                    >
                        <option value="active">Active</option>
                        <option value="contacted">Contacted</option>
                        <option value="booked">Booked</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No waitlist entries found
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Staff</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Dates</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{entry.clientName}</div>
                                        <div className="text-sm text-gray-500">{entry.clientEmail}</div>
                                        <div className="text-sm text-gray-500">{entry.clientPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{entry.serviceName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <ul className="list-disc list-inside">
                                            {entry.preferredStaffNames?.map((name) => (
                                                <li key={name} className="text-sm text-gray-900">
                                                    {name}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4">
                                        <ul className="list-disc list-inside">
                                            {entry.preferredDates.map((date) => (
                                                <li key={date} className="text-sm text-gray-900">
                                                    {format(parseISO(date), 'MMM d, yyyy')}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={entry.status}
                                            onChange={(e) => updateStatus(entry.id, e.target.value as any)}
                                            className="text-sm border rounded px-2 py-1"
                                        >
                                            <option value="active">Active</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="booked">Booked</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {format(parseISO(entry.createdAt), 'MMM d, yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => deleteEntry(entry.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
