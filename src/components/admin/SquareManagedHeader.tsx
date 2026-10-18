'use client';

import { ExternalLink, RefreshCw } from 'lucide-react';

export const SQUARE_DASHBOARD_URL = 'https://app.squareup.com/dashboard';

interface SquareManagedHeaderProps {
    title: string;
    description: string;
    /** Where in the Square Dashboard these things are edited */
    squarePath: string;
    squareLabel: string;
    onRefresh: () => void;
    isLoading: boolean;
}

/** Page header for admin pages that only display data owned by Square */
export default function SquareManagedHeader({
    title,
    description,
    squarePath,
    squareLabel,
    onRefresh,
    isLoading,
}: SquareManagedHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
                <h1 className="text-3xl font-semibold">{title}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
                <a
                    href={`${SQUARE_DASHBOARD_URL}${squarePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90"
                >
                    {squareLabel}
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}
