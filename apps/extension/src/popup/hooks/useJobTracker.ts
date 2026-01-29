import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { JobApplication, MetadataResponse } from '@cata/shared-types';

export const useJobTracker = (setStatus: (status: any) => void, isExpanded: boolean, selectedModelId: number | null) => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [currentJob, setCurrentJob] = useState<{ title: string; company: string; url: string; pageText?: string }>({
        title: '',
        company: '',
        url: '',
        pageText: ''
    });
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
        setIsExtracting(true);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_JOB_METADATA' }, async (response: MetadataResponse) => {
                    if (response) {
                        setCurrentJob({
                            title: response.title,
                            company: response.company,
                            url: response.url,
                            pageText: response.pageText
                        });

                        // If AI model is selected and we have page text, try to improve extraction
                        if (selectedModelId && response.pageText && (!response.title || !response.company)) {
                            try {
                                const aiRes = await fetch(`${API_BASE_URL}/job-applications/extract-metadata`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        pageText: response.pageText,
                                        modelId: selectedModelId
                                    })
                                });
                                if (aiRes.ok) {
                                    const aiData = await aiRes.json();
                                    setCurrentJob(prev => ({
                                        ...prev,
                                        title: aiData.title || prev.title,
                                        company: aiData.company || prev.company
                                    }));
                                }
                            } catch (err) {
                                console.error('AI Metadata extraction failed', err);
                            }
                        }
                    }
                    setIsExtracting(false);
                });
            } else {
                setIsExtracting(false);
            }
        });
    };

    useEffect(() => {
        if (isExpanded) {
            fetchApplications();
            // Don't auto-fetch metadata on expand, let user click the button if they want
        }
    }, [isExpanded]);

    const addApplication = async (data: { title: string; company: string; notes: string }) => {
        if (isSaving) return;
        setIsSaving(true);
        setStatus({ type: 'loading', message: 'Saving application...' });

        try {
            const res = await fetch(`${API_BASE_URL}/job-applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    company: data.company,
                    url: currentJob.url,
                    notes: data.notes,
                    status: 'Interested',
                    pageText: currentJob.pageText,
                    modelId: selectedModelId
                }),
            });

            if (!res.ok) throw new Error('Failed to save application');

            setStatus({ type: 'success', message: 'Application saved!' });
            await fetchApplications();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsSaving(false);
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
        isSaving,
        addApplication,
        updateStatus,
        deleteApplication,
        refreshMetadata: fetchPageMetadata
    };
};
