import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { JobApplication, MetadataResponse } from '@cata/shared-types';

interface Status {
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    errorType?: string;
}

export const useJobTracker = (setStatus: (status: Status) => void, isExpanded: boolean, selectedModelId: number | null) => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Interested');
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
            let url = `${API_BASE_URL}/job-applications?limit=100`;
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            } else if (filterStatus) {
                url += `&status=${encodeURIComponent(filterStatus)}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch job applications');
            const data = await res.json();
            setApplications(data);
        } catch (err: unknown) {
            console.error(err);
        }
    };

    const fetchPageMetadata = () => {
        setIsExtracting(true);
        setStatus({ type: 'loading', message: 'Detecting job details...' });

        // Use lastFocusedWindow: true which is more reliable from side panel/popup
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab?.id) {
                setStatus({ type: 'error', message: 'No active tab found' });
                setIsExtracting(false);
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, { type: 'GET_JOB_METADATA' }, async (response: MetadataResponse) => {
                // Check for extension errors (e.g. content script not loaded)
                if (chrome.runtime.lastError) {
                    console.error('Metadata extraction error:', chrome.runtime.lastError);
                    setStatus({ 
                        type: 'error', 
                        message: 'Could not connect to page. Please refresh the page and try again.' 
                    });
                    setIsExtracting(false);
                    return;
                }

                if (response) {
                    setCurrentJob({
                        title: response.title || '',
                        company: response.company || '',
                        url: response.url || '',
                        pageText: response.pageText
                    });

                    // If AI model is selected and we have page text, try to improve extraction
                    if (selectedModelId && response.pageText && (!response.title || !response.company)) {
                        try {
                            setStatus({ type: 'loading', message: 'Enhancing with AI...' });
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
                                setStatus({ type: 'success', message: 'Details extracted!' });
                            } else {
                                setStatus({ type: 'success', message: 'Extracted (basic)' });
                            }
                        } catch (err) {
                            console.error('AI Metadata extraction failed', err);
                            setStatus({ type: 'success', message: 'Extracted (basic)' });
                        }
                    } else {
                        setStatus({ type: 'success', message: 'Details extracted!' });
                    }
                } else {
                    setStatus({ type: 'error', message: 'Failed to extract details' });
                }
                setIsExtracting(false);
            });
        });
    };

    useEffect(() => {
        if (isExpanded) {
            fetchApplications();
        }
    }, [isExpanded, searchTerm, filterStatus]);

    const addApplication = async (data: { title: string; company: string; notes: string }, force = false) => {
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
                    full_text_description: currentJob.pageText,
                    modelId: selectedModelId,
                    force: force
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const detail = errorData.detail;
                
                if (typeof detail === 'object') {
                    setStatus({ 
                        type: 'error', 
                        message: detail.message,
                        errorType: detail.type 
                    });
                    return;
                }
                
                throw new Error(detail || 'Failed to save application');
            }

            setStatus({ type: 'success', message: 'Application saved!' });
            await fetchApplications();
            // Clear current job after success
            setCurrentJob(prev => ({ ...prev, title: '', company: '' }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setStatus({ type: 'error', message });
        } finally {
            setIsSaving(false);
        }
    };

    const updateNotes = async (id: number, notes: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            });
            if (!res.ok) throw new Error('Failed to update notes');
            fetchApplications();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setStatus({ type: 'error', message });
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
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setStatus({ type: 'error', message });
        }
    };

    const deleteApplication = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete application');
            fetchApplications();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setStatus({ type: 'error', message });
        }
    };

    return {
        applications,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        currentJob,
        isExtracting,
        isSaving,
        addApplication,
        updateStatus,
        updateNotes,
        deleteApplication,
        refreshMetadata: fetchPageMetadata
    };
};
