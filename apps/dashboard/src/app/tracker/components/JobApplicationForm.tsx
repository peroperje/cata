"use client";

import React, { useState } from 'react';
import { JobApplication } from '@cata/shared-types';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface JobApplicationFormProps {
    initialData?: Partial<JobApplication>;
    isEditing?: boolean;
}

const statuses = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];

export function JobApplicationForm({ initialData, isEditing = false }: JobApplicationFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        company: initialData?.company || '',
        url: initialData?.url || '',
        status: initialData?.status || 'Interested',
        notes: initialData?.notes || '',
        is_favorite: initialData?.is_favorite || false,
        is_irrelevant: initialData?.is_irrelevant || false,
    });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = isEditing
                ? `${API_BASE_URL}/job-applications/${initialData?.id}`
                : `${API_BASE_URL}/job-applications`;

            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/tracker');
                router.refresh();
            } else {
                const error = await response.json();
                console.error('Failed to save application:', error);
                alert('Failed to save application. Please check the data.');
            }
        } catch (error) {
            console.error('Error saving application:', error);
            alert('An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/tracker" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                    {isEditing ? 'Edit Application' : 'Add New Application'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="e.g. Senior Frontend Engineer"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="e.g. Acme Corp"
                            value={formData.company}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                            Job Posting URL
                        </label>
                        <input
                            type="url"
                            id="url"
                            name="url"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="https://linkedin.com/jobs/..."
                            value={formData.url}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            {statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={4}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                            placeholder="Add your thoughts or application details here..."
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="is_favorite"
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 transition-colors"
                                checked={formData.is_favorite}
                                onChange={handleChange}
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Favorite</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="is_irrelevant"
                                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 transition-colors"
                                checked={formData.is_irrelevant}
                                onChange={handleChange}
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Irrelevant</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Link
                        href="/tracker"
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save size={18} />
                        {isLoading ? 'Saving...' : (isEditing ? 'Update Application' : 'Save Application')}
                    </button>
                </div>
            </form>
        </div>
    );
}
