"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GmailJobCard, Pagination } from '@cata/shared-ui';
import { GmailJobPagination, JobApplication } from '@cata/shared-types';
import { cn } from '../../../lib/utils';
import { Loader2 } from 'lucide-react';

interface JobsTabbedViewProps {
    searchTerm: string;
    onToggleUsed: (id: number) => Promise<void>;
    onToggleIrrelevant: (id: number) => Promise<void>;
    selectedJobId: number | null;
    onSelectJob: (id: number) => void;
    onTotalItemsChange?: (total: number) => void;
    onLinkApplication?: (jobId: number, applicationId: number) => Promise<void>;
    onUnlinkApplication?: (jobId: number) => Promise<void>;
    onSearchApplications?: (query: string) => Promise<JobApplication[]>;
}

type TabType = 'new' | 'used' | 'irrelevant';

interface TabConfig {
    id: TabType;
    label: string;
    is_used: boolean;
    is_irrelevant: boolean;
}

const TABS: TabConfig[] = [
    { id: 'new', label: 'New Jobs', is_used: false, is_irrelevant: false },
    { id: 'used', label: 'Used', is_used: true, is_irrelevant: false },
    { id: 'irrelevant', label: 'Irrelevant', is_used: false, is_irrelevant: true },
];

export const JobsTabbedView = ({ 
    searchTerm, 
    onToggleUsed, 
    onToggleIrrelevant,
    selectedJobId,
    onSelectJob,
    onTotalItemsChange,
    onLinkApplication,
    onUnlinkApplication,
    onSearchApplications
}: JobsTabbedViewProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('new');
    const [tabState, setTabState] = useState<Record<TabType, { page: number, data: GmailJobPagination | null }>>({
        new: { page: 1, data: null },
        used: { page: 1, data: null },
        irrelevant: { page: 1, data: null },
    });
    const [searchState, setSearchState] = useState<{ page: number, data: GmailJobPagination | null }>({
        page: 1,
        data: null
    });
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const fetchJobs = useCallback(async (
        page: number, 
        isSearch = false,
        isUsed?: boolean, 
        isIrrelevant?: boolean
    ) => {
        setIsLoading(true);
        try {
            let url = `${API_BASE_URL}/gmail/jobs?page=${page}&size=20`;
            if (isSearch) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            } else {
                if (isUsed !== undefined) url += `&is_used=${isUsed}`;
                if (isIrrelevant !== undefined) url += `&is_irrelevant=${isIrrelevant}`;
            }

            const res = await fetch(url);
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch jobs: ${res.status} - ${errorText}`);
            }
            const data: GmailJobPagination = await res.json();

            if (isSearch) {
                setSearchState({ page, data });
            } else {
                setTabState(prev => ({
                    ...prev,
                    [activeTab]: { page, data }
                }));
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL, searchTerm, activeTab]);

    useEffect(() => {
        if (searchTerm) {
            fetchJobs(1, true);
        } else {
            const config = TABS.find(t => t.id === activeTab);
            if (config) {
                fetchJobs(tabState[activeTab].page, false, config.is_used, config.is_irrelevant);
            }
        }
    }, [searchTerm, activeTab, fetchJobs]); // Re-fetch on tab change or search term change

    const handlePageChange = (newPage: number) => {
        if (searchTerm) {
            fetchJobs(newPage, true);
        } else {
            const config = TABS.find(t => t.id === activeTab);
            if (config) {
                fetchJobs(newPage, false, config.is_used, config.is_irrelevant);
            }
        }
    };

    const currentData = searchTerm ? searchState.data : tabState[activeTab].data;
    const currentPage = searchTerm ? searchState.page : tabState[activeTab].page;

    useEffect(() => {
        if (currentData && onTotalItemsChange) {
            onTotalItemsChange(currentData.total);
        }
    }, [currentData, onTotalItemsChange]);

    const renderJobs = () => {
        if (isLoading && !currentData) {
            return (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            );
        }

        if (!currentData || currentData.items.length === 0) {
            return (
                <div className="text-center py-20 border-2 border-dashed border-[#334155] rounded-2xl text-gray-400">
                    No jobs found.
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentData.items.map(job => (
                        <GmailJobCard 
                            key={job.id} 
                            job={job} 
                            onToggleUsed={async (id: number) => {
                                await onToggleUsed(id);
                                // Refresh current view
                                handlePageChange(currentPage);
                            }}
                            onToggleIrrelevant={async (id: number) => {
                                await onToggleIrrelevant(id);
                                handlePageChange(currentPage);
                            }}
                            onLinkApplication={async (jobId: number, appId: number) => {
                                if (onLinkApplication) await onLinkApplication(jobId, appId);
                                handlePageChange(currentPage);
                            }}
                            onUnlinkApplication={async (jobId: number) => {
                                if (onUnlinkApplication) await onUnlinkApplication(jobId);
                                handlePageChange(currentPage);
                            }}
                            onSearchApplications={onSearchApplications}
                            isSelected={selectedJobId === job.id}
                            onSelect={onSelectJob}
                        />
                    ))}
                </div>
                <Pagination 
                    currentPage={currentPage}
                    totalPages={currentData.pages}
                    onPageChange={handlePageChange}
                    itemsPerPage={currentData.size}
                    totalItems={currentData.total}
                />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {!searchTerm && (
                <div className="flex border-b border-[#334155]">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium transition-colors relative",
                                activeTab === tab.id 
                                    ? "text-indigo-400" 
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {renderJobs()}
        </div>
    );
};
