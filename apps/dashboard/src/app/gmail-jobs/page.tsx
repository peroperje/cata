"use client";

import React, { useState, useEffect } from 'react';
import { JobCard, Pagination, useJobSelection } from '@cata/shared-ui';
import { GmailJob, GmailSettings, GmailFilter } from '@cata/shared-types';
import { Search, Mail, Settings, Plus, Trash2, RefreshCw, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function GmailJobsPage() {
    const [jobs, setJobs] = useState<GmailJob[]>([]);
    const [settings, setSettings] = useState<GmailSettings | null>(null);
    const [filters, setFilters] = useState<GmailFilter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [newFilter, setNewFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const { selectedJobId, handleSelectJob } = useJobSelection();
    const itemsPerPage = 20;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [jobsRes, settingsRes, filtersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/gmail/jobs`),
                fetch(`${API_BASE_URL}/gmail/settings`),
                fetch(`${API_BASE_URL}/gmail/filters`)
            ]);

            const jobsData = await jobsRes.json();
            const settingsData = await settingsRes.json();
            const filtersData = await filtersRes.json();

            if (Array.isArray(jobsData)) setJobs(jobsData);
            setSettings(settingsData);
            if (Array.isArray(filtersData)) setFilters(filtersData);
        } catch (error) {
            console.error('Failed to fetch Gmail data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleUsed = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/jobs/${id}/used`, { method: 'PATCH' });
            setJobs(prev => prev.map(j => j.id === id ? { ...j, is_used: !j.is_used } : j));
        } catch (error) {
            console.error('Failed to toggle used:', error);
        }
    };

    const handleToggleIrrelevant = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/gmail/jobs/${id}/irrelevant`, { method: 'PATCH' });
            setJobs(prev => prev.map(j => j.id === id ? { ...j, is_irrelevant: !j.is_irrelevant } : j));
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

    const handleAddFilter = async () => {
        if (!newFilter) return;
        try {
            const res = await fetch(`${API_BASE_URL}/gmail/filters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_sender: newFilter })
            });
            const data = await res.json();
            setFilters(prev => [...prev, data]);
            setNewFilter('');
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

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const currentJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6 max-w-7xl mx-auto text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Mail className="text-indigo-400" />
                    Gmail Jobs
                </h1>
                <div className="flex items-center gap-4">
                    {settings && (
                        <div className="flex items-center gap-4 bg-[#1e293b] border border-[#334155] p-2 px-4 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Sync is</span>
                                <button 
                                    onClick={() => handleUpdateSettings({ is_active: !settings.is_active })}
                                    className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold uppercase transition",
                                        settings.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                    )}
                                >
                                    {settings.is_active ? "Active" : "Inactive"}
                                </button>
                            </div>
                            <div className="w-px h-4 bg-[#334155]" />
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Interval</span>
                                <select 
                                    value={settings.fetch_interval_minutes}
                                    onChange={(e) => handleUpdateSettings({ fetch_interval_minutes: parseInt(e.target.value) })}
                                    className="bg-transparent border-none text-sm text-indigo-400 font-bold focus:ring-0 cursor-pointer"
                                >
                                    <option value={15}>15m</option>
                                    <option value={30}>30m</option>
                                    <option value={60}>1h</option>
                                    <option value={1440}>24h</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={fetchData} 
                        className="p-2 bg-[#1e293b] border border-[#334155] rounded-xl hover:bg-[#334155] transition"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                {/* Filters Section */}
                <div className="lg:col-span-1 border border-[#334155] rounded-2xl p-6 bg-[#1e293b]/50">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Settings size={20} className="text-indigo-400" />
                        Sender Filters
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="email@example.com"
                                value={newFilter}
                                onChange={(e) => setNewFilter(e.target.value)}
                                className="flex-1 bg-transparent border border-[#334155] rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <button 
                                onClick={handleAddFilter}
                                className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {filters.map(filter => (
                                <div key={filter.id} className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg border border-[#334155] text-sm">
                                    <span className="truncate">{filter.email_sender}</span>
                                    <button 
                                        onClick={() => handleDeleteFilter(filter.id)}
                                        className="text-gray-500 hover:text-red-400 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {filters.length === 0 && (
                                <div className="text-center py-4 text-xs text-gray-500 italic">
                                    No filters added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Jobs Section */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-[#1e293b]/50 border border-[#334155] p-4 rounded-2xl flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search Gmail jobs..."
                                className="w-full pl-10 pr-10 py-2 bg-transparent border border-[#334155] rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="text-sm text-gray-400">
                            {filteredJobs.length} Jobs
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentJobs.map(job => (
                                    <JobCard 
                                        key={job.id} 
                                        job={job as any} 
                                        onToggleUsed={handleToggleUsed}
                                        onToggleIrrelevant={handleToggleIrrelevant}
                                        isSelected={selectedJobId === job.id}
                                        onSelect={handleSelectJob}
                                    />
                                ))}
                            </div>
                            {filteredJobs.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-[#334155] rounded-2xl text-gray-500">
                                    No Gmail jobs found.
                                </div>
                            )}
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredJobs.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
