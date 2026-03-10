"use client";

import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { GmailSettings, GmailFilter } from '@cata/shared-types';
import { useJobSelection } from '@cata/shared-ui';
import { SyncSettings } from './components/SyncSettings';
import { SenderFilters } from './components/SenderFilters';
import { SearchBar } from './components/SearchBar';
import { JobsTabbedView } from './components/JobsTabbedView';

export default function GmailJobsPage() {
    const [settings, setSettings] = useState<GmailSettings | null>(null);
    const [filters, setFilters] = useState<GmailFilter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { selectedJobId, handleSelectJob } = useJobSelection();

    const [totalJobs, setTotalJobs] = useState(0);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [settingsRes, filtersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/gmail/settings`),
                fetch(`${API_BASE_URL}/gmail/filters`)
            ]);

            if (!settingsRes.ok || !filtersRes.ok) {
                const settingsText = !settingsRes.ok ? await settingsRes.text() : '';
                const filtersText = !filtersRes.ok ? await filtersRes.text() : '';
                console.error('API Error details:', { settingsText, filtersText });
                throw new Error(`Failed to fetch data: Settings: ${settingsRes.status}, Filters: ${filtersRes.status}`);
            }

            const settingsData = await settingsRes.json();
            const filtersData = await filtersRes.json();

            setSettings(settingsData);
            if (Array.isArray(filtersData)) setFilters(filtersData);
        } catch (error) {
            console.error('Failed to fetch Gmail data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleToggleUsed = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/jobs/${id}/used`, { method: 'PATCH' });
        } catch (error) {
            console.error('Failed to toggle used:', error);
        }
    };

    const handleToggleIrrelevant = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/jobs/${id}/irrelevant`, { method: 'PATCH' });
        } catch (error) {
            console.error('Failed to toggle irrelevant:', error);
        }
    };

    const handleUpdateSettings = async (updates: Partial<GmailSettings>) => {
        try {
            const res = await fetch(`${API_BASE_URL}/gmail/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    const handleAddFilter = async (email: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/gmail/filters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_sender: email })
            });
            const data = await res.json();
            setFilters(prev => [...prev, data]);
        } catch (error) {
            console.error('Failed to add filter:', error);
        }
    };

    const handleDeleteFilter = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/filters/${id}`, { method: 'DELETE' });
            setFilters(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Failed to delete filter:', error);
        }
    };

    const handleToggleFilter = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/filters/${id}/toggle`, { method: 'PATCH' });
            setFilters(prev => prev.map(f => f.id === id ? { ...f, is_active: !f.is_active } : f));
        } catch (error) {
            console.error('Failed to toggle filter:', error);
        }
    };

    const handleLinkApplication = async (jobId: number, application_id: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/jobs/${jobId}/link/${application_id}`, { method: 'POST' });
        } catch (error) {
            console.error('Failed to link application:', error);
        }
    };

    const handleUnlinkApplication = async (jobId: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/jobs/${jobId}/unlink`, { method: 'POST' });
        } catch (error) {
            console.error('Failed to unlink application:', error);
        }
    };

    const handleSearchApplications = async (query: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications?search=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to search applications:', error);
            return [];
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Mail className="text-indigo-400" />
                    Gmail Jobs
                </h1>
                <div className="flex items-center gap-4">
                    <SyncSettings 
                        settings={settings} 
                        onUpdateSettings={handleUpdateSettings} 
                    />
                    <button 
                        onClick={fetchInitialData} 
                        className="p-2 bg-[#1e293b] border border-[#334155] rounded-xl hover:bg-[#334155] transition"
                        title="Refresh settings and filters"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Filters Section */}
                <SenderFilters 
                    filters={filters}
                    onAddFilter={handleAddFilter}
                    onDeleteFilter={handleDeleteFilter}
                    onToggleFilter={handleToggleFilter}
                />

                {/* Main Jobs Section */}
                <div className="space-y-6">
                    <SearchBar 
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        totalItems={totalJobs} 
                    />

                    <JobsTabbedView 
                        searchTerm={searchTerm}
                        onToggleUsed={handleToggleUsed}
                        onToggleIrrelevant={handleToggleIrrelevant}
                        selectedJobId={selectedJobId || null}
                        onSelectJob={handleSelectJob}
                        onTotalItemsChange={setTotalJobs}
                        onLinkApplication={handleLinkApplication}
                        onUnlinkApplication={handleUnlinkApplication}
                        onSearchApplications={handleSearchApplications}
                    />
                </div>
            </div>
        </div>
    );
}
