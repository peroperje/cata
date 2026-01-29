"use client";

import React, { useState, useEffect } from 'react';
import { ApplicationCard, ConfirmModal } from '@cata/shared-ui';
import { JobApplication } from '@cata/shared-types';
import { Plus, Search } from 'lucide-react';

export default function TrackerPage() {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            let url = `${API_BASE_URL}/job-applications?limit=100`;
            if (searchTerm) url += `&job_title=${encodeURIComponent(searchTerm)}`;
            if (filterStatus) url += `&status=${encodeURIComponent(filterStatus)}`;

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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Job Applications Tracker</h1>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition">
                    <Plus size={20} />
                    Add Application
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title, company..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Interested">Interested</option>
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
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
