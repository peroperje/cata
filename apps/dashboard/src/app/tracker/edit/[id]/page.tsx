"use client";

import React, { useEffect, useState } from 'react';
import { JobApplicationForm } from '../../components/JobApplicationForm';
import { JobApplication } from '@cata/shared-types';
import { useParams } from 'next/navigation';

export default function EditApplicationPage() {
    const params = useParams();
    const id = params.id;
    const [application, setApplication] = useState<JobApplication | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    useEffect(() => {
        if (!id) return;

        const fetchApplication = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/job-applications/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setApplication(data);
                }
            } catch (error) {
                console.error('Failed to fetch application:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApplication();
    }, [id, API_BASE_URL]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h2 className="text-2xl font-bold text-white">Application not found</h2>
                <button
                    onClick={() => window.location.href = '/tracker'}
                    className="text-indigo-400 hover:text-indigo-300"
                >
                    Back to Tracker
                </button>
            </div>
        );
    }

    return <JobApplicationForm initialData={application} isEditing={true} />;
}
