import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { JobApplication } from '../../types';

export const useJobTracker = (setStatus: (status: any) => void, isExpanded: boolean) => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [currentJob, setCurrentJob] = useState<{ title: string; company: string; url: string }>({
        title: '',
        company: '',
        url: '',
    });

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications`);
            if (!res.ok) throw new Error('Failed to fetch job applications');
            const data = await res.json();
            setApplications(data);
        } catch (err: any) {
            console.error(err);
        }
    };

    const fetchPageMetadata = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_JOB_METADATA' }, (response) => {
                    if (response) {
                        setCurrentJob(response);
                    }
                });
            }
        });
    };

    useEffect(() => {
        if (isExpanded) {
            fetchApplications();
            fetchPageMetadata();
        }
    }, [isExpanded]);

    const addApplication = async (notes: string) => {
        setStatus({ type: 'loading', message: 'Saving application...' });
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...currentJob,
                    notes,
                    status: 'Interested'
                }),
            });
            if (!res.ok) throw new Error('Failed to save application');
            setStatus({ type: 'success', message: 'Application saved!' });
            fetchApplications();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            fetchApplications();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const deleteApplication = async (id: number) => {
        if (!confirm('Are you sure you want to delete this application?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete application');
            fetchApplications();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    return {
        applications,
        currentJob,
        addApplication,
        updateStatus,
        deleteApplication,
        refreshMetadata: fetchPageMetadata
    };
};
