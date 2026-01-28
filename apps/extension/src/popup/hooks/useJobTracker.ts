import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { JobApplication, MetadataResponse } from '../../types';

export const useJobTracker = (setStatus: (status: any) => void, isExpanded: boolean, selectedModelId: number | null) => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [currentJob, setCurrentJob] = useState<{ title: string; company: string; url: string }>({
        title: '',
        company: '',
        url: '',
    });
    const [isExtracting, setIsExtracting] = useState(false);

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
                chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_JOB_METADATA' }, (response: MetadataResponse) => {
                    if (response) {
                        setCurrentJob({
                            title: response.title,
                            company: response.company,
                            url: response.url
                        });
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
        setStatus({ type: 'loading', message: 'Reading page and saving...' });
        setIsExtracting(true);

        // 1. Get current page content fresh
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                setStatus({ type: 'error', message: 'No active tab found' });
                setIsExtracting(false);
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_JOB_METADATA' }, async (response: MetadataResponse) => {
                if (!response) {
                    setStatus({ type: 'error', message: 'Could not read page content' });
                    setIsExtracting(false);
                    return;
                }

                try {
                    // 2. Send to backend - backend will handle AI extraction if needed
                    const res = await fetch(`${API_BASE_URL}/job-applications`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: response.title,
                            company: response.company,
                            url: response.url,
                            notes: notes,
                            pageText: response.pageText,
                            modelId: selectedModelId,
                            status: 'Interested'
                        }),
                    });

                    if (!res.ok) throw new Error('Failed to save application');

                    setStatus({ type: 'success', message: 'Application saved!' });
                    fetchApplications();
                    // Update current job in case backend found better info
                    const savedApp = await res.json();
                    setCurrentJob({
                        title: savedApp.title,
                        company: savedApp.company,
                        url: savedApp.url
                    });
                } catch (err: any) {
                    setStatus({ type: 'error', message: err.message });
                } finally {
                    setIsExtracting(false);
                }
            });
        });
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
        isExtracting,
        addApplication,
        updateStatus,
        deleteApplication,
        refreshMetadata: fetchPageMetadata
    };
};
