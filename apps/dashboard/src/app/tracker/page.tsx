"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { ApplicationCard, ConfirmModal } from '@cata/shared-ui';
import { JobApplication } from '@cata/shared-types';
import { Plus, Search, Edit2, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

function TrackerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    const filterStatus = searchParams.get('status') || '';
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const statuses = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            let url = `${API_BASE_URL}/job-applications?limit=100`;
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            } else if (filterStatus) {
                url += `&status=${encodeURIComponent(filterStatus)}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [searchTerm, filterStatus]);

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await fetch(`${API_BASE_URL}/job-applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchApplications();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async () => {
        if (idToDelete === null) return;
        try {
            await fetch(`${API_BASE_URL}/job-applications/${idToDelete}`, {
                method: 'DELETE'
            });
            fetchApplications();
        } catch (error) {
            console.error('Failed to delete application:', error);
        }
    };

    const updateFilter = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (status) {
            params.set('status', status);
        } else {
            params.delete('status');
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Job Applications Tracker</h1>
                <Link
                    href="/tracker/add"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <Plus size={20} />
                    Add Application
                </Link>
            </div>

            <div className="flex flex-col gap-6 mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title, company..."
                        className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{ right: '1.25rem' }}
                                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                title="Clear search"
                            >
                                <X size={18} />
                            </button>
                    )}
                </div>

                {!searchTerm && (
                    <div className="flex flex-wrap gap-2 border-b border-gray-200">
                        <button
                            onClick={() => updateFilter('')}
                            className={`px-4 py-2 text-sm font-medium transition-colors relative ${filterStatus === ''
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            All Statuses
                        </button>
                        {statuses.map(s => (
                            <button
                                key={s}
                                onClick={() => updateFilter(s)}
                                className={`px-4 py-2 text-sm font-medium transition-colors relative ${filterStatus === s
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.map(app => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            onUpdateStatus={handleUpdateStatus}
                            onDeleteClick={setIdToDelete}
                            editLink={
                                <Link
                                    href={`/tracker/edit/${app.id}`}
                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="Edit Application"
                                >
                                    <Edit2 size={16} />
                                </Link>
                            }
                        />
                    ))}
                    {applications.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                            No applications found matching your criteria.
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={idToDelete !== null}
                onClose={() => setIdToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Application"
                message="Are you sure you want to remove this application from your tracker? This action cannot be undone."
                type="danger"
            />
        </div>
    );
}

export default function TrackerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TrackerContent />
        </Suspense>
    );
}
