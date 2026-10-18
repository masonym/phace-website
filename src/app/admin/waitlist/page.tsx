'use client';

import { ExternalLink } from 'lucide-react';
import { SQUARE_DASHBOARD_URL } from '@/components/admin/SquareManagedHeader';

const WAITLIST_URL = process.env.NEXT_PUBLIC_WAITLIST_URL;

export default function WaitlistPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-semibold">Waitlist</h1>
            <p className="text-gray-600 mt-2">
                Appointment waitlists are handled by Square. When a client can&apos;t find a time that works on the
                booking page, the &quot;Join the waitlist&quot; link takes them to Square&apos;s booking site, and
                you manage their request in Square Appointments.
            </p>

            <div className="mt-6 bg-white rounded-lg shadow-sm border divide-y">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-medium">See and manage waitlist requests</h2>
                        <p className="text-sm text-gray-500 mt-1">Open Appointments in the Square Dashboard or the Square app.</p>
                    </div>
                    <a
                        href={SQUARE_DASHBOARD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 shrink-0"
                    >
                        Open Square Dashboard
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>

                <div className="p-5">
                    <h2 className="font-medium">Link clients are sent to</h2>
                    {WAITLIST_URL ? (
                        <a
                            href={WAITLIST_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm text-accent hover:underline break-all"
                        >
                            {WAITLIST_URL}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                    ) : (
                        <p className="mt-1 text-sm text-red-700">
                            Not set. Add NEXT_PUBLIC_WAITLIST_URL to the site&apos;s environment variables, or the booking page
                            won&apos;t show a waitlist link at all.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
