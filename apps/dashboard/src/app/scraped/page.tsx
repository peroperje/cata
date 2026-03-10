"use client";

import React, { useState, useEffect } from 'react';
import { ScraperJobCard, Pagination, useJobSelection } from '@cata/shared-ui';
import { ScrapedJob, ScraperStatus, JobApplication } from '@cata/shared-types';
import { Search, Database, StopCircle, Play, Trash2, Calendar, Star, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ScrapedPage() {
    const [jobs, setJobs] = useState<ScrapedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<ScraperStatus>({ status: 'stopped', job_count: 0, irrelevant_count: 0 });
    const [scraperUrl, setScraperUrl] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [includeIrrelevant, setIncludeIrrelevant] = useState(false);
    const [onlyIrrelevant, setOnlyIrrelevant] = useState(false);
    const [includeUsed, setIncludeUsed] = useState(false);
    const [onlyUsed, setOnlyUsed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteBeforeDate, setDeleteBeforeDate] = useState('');
    const { selectedJobId, handleSelectJob } = useJobSelection();
    const itemsPerPage = 20;

    const totalPages = Math.ceil((jobs?.length || 0) / itemsPerPage);
    const currentJobs = Array.isArray(jobs) ? jobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            let url = `${API_BASE_URL}/scraper/jobs?limit=100`;
            if (searchTerm) url += `&title=${encodeURIComponent(searchTerm)}`;
            if (onlyIrrelevant) {
                url += `&only_irrelevant=true`;
            } else if (includeIrrelevant) {
                url += `&include_irrelevant=true`;
            }

            if (onlyUsed) {
                url += `&is_used=true`;
            } else if (!includeUsed) {
                url += `&is_used=false`;
            }

            const res = await fetch(url);
            const data: ScrapedJob[] = await res.json();
            if (Array.isArray(data)) {
                setJobs(data);
            } else {
                console.error('API returned non-array data:', data);
                setJobs([]);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            setJobs([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/status`);
            const data: ScraperStatus = await res.json();
            setStatus(data);
            setIsScraping(data.status === 'running');
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    };

    useEffect(() => {
        fetchJobs();
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [searchTerm, includeIrrelevant, onlyIrrelevant, includeUsed, onlyUsed]);

    const handleStartScraper = async () => {
        if (!scraperUrl) return;
        try {
            await fetch(`${API_BASE_URL}/scraper/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scraperUrl })
            });
            fetchStatus();
        } catch (error) {
            console.error('Failed to start scraper:', error);
        }
    };

    const handleStopScraper = async () => {
        try {
            await fetch(`${API_BASE_URL}/scraper/stop`, {
                method: 'POST'
            });
            fetchStatus();
        } catch (error) {
            console.error('Failed to stop scraper:', error);
        }
    };

    const handleToggleUsed = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/jobs/${id}/used`, { method: 'PATCH' });
            fetchJobs();
        } catch (error) {
            console.error('Failed to toggle used:', error);
        }
    };

    const handleToggleIrrelevant = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/jobs/${id}/irrelevant`, { method: 'PATCH' });
            fetchJobs();
        } catch (error) {
            console.error('Failed to toggle irrelevant:', error);
        }
    };

    const handleBulkDelete = async (all = false) => {
        const msg = all 
            ? "Are you sure you want to delete ALL scraped jobs?" 
            : `Are you sure you want to delete jobs created before ${deleteBeforeDate}?`;
        
        if (!confirm(msg)) return;

        try {
            let url = `${API_BASE_URL}/scraper/jobs`;
            if (!all && deleteBeforeDate) {
                url += `?before_date=${deleteBeforeDate}T23:59:59`;
            }

            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                fetchJobs();
                fetchStatus();
                if (!all) setDeleteBeforeDate('');
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Failed to delete jobs:', error);
        }
    };

    const handleLinkApplication = async (jobId: number, application_id: number) => {
        try {
            await fetch(`${API_BASE_URL}/jobs/${jobId}/link/${application_id}`, { method: 'POST' });
            fetchJobs();
        } catch (error) {
            console.error('Failed to link application:', error);
        }
    };

    const handleUnlinkApplication = async (jobId: number) => {
        try {
            await fetch(`${API_BASE_URL}/jobs/${jobId}/unlink`, { method: 'POST' });
            fetchJobs();
        } catch (error) {
            console.error('Failed to unlink application:', error);
        }
    };

    const handleSearchApplications = async (query: string): Promise<JobApplication[]> => {
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications?search=${encodeURIComponent(query)}&limit=5`);
            const data: JobApplication[] = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to search applications:', error);
            return [];
        }
    };


    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Scraped Jobs</h1>
                <div className="flex items-center gap-4 bg-transparent p-2 rounded-xl border border-[#334155] shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1 bg-transparent rounded-lg border border-[#334155]">
                        <Database size={16} className="text-indigo-400" />
                        <span className="text-sm font-semibold text-indigo-400">{status.job_count} Total</span>
                    </div>
                    {!onlyIrrelevant && !onlyUsed && (
                        <label className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition",
                            {
                                "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]": includeIrrelevant,
                                "bg-transparent border-indigo-900/30 text-indigo-400 hover:bg-indigo-900/10": !includeIrrelevant
                            }
                        )}>
                            <input 
                                type="checkbox" 
                                checked={includeIrrelevant} 
                                onChange={(e) => {
                                    setIncludeIrrelevant(e.target.checked);
                                    if (e.target.checked) setOnlyIrrelevant(false);
                                    setCurrentPage(1);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-semibold">Show Irrelevant</span>
                        </label>
                    )}
                    {!onlyIrrelevant && !onlyUsed && (
                        <label className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition",
                            {
                                "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]": includeUsed,
                                "bg-transparent border-amber-900/30 text-amber-400 hover:bg-amber-900/10": !includeUsed
                            }
                        )}>
                            <input 
                                type="checkbox" 
                                checked={includeUsed} 
                                onChange={(e) => {
                                    setIncludeUsed(e.target.checked);
                                    if (e.target.checked) setOnlyUsed(false);
                                    setCurrentPage(1);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-sm font-semibold">Show In Use</span>
                        </label>
                    )}
                    <button 
                        onClick={() => {
                            setOnlyUsed(!onlyUsed);
                            if (!onlyUsed) {
                                setOnlyIrrelevant(false);
                                setIncludeUsed(true);
                            }
                            setCurrentPage(1);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-lg border transition",
                            {
                                "bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]": onlyUsed,
                                "bg-transparent border-amber-900/30 text-amber-400 hover:bg-amber-900/10": !onlyUsed
                            }
                        )}
                    >
                        <Star size={16} className={cn(onlyUsed ? "text-amber-500" : "text-amber-400")} />
                        <span className="text-sm font-semibold">In Use</span>
                    </button>
                    <button 
                        onClick={() => {
                            setOnlyIrrelevant(!onlyIrrelevant);
                            if (!onlyIrrelevant) {
                                setOnlyUsed(false);
                                setIncludeIrrelevant(true);
                            }
                            setCurrentPage(1);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-lg border transition",
                            {
                                "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]": onlyIrrelevant,
                                "bg-transparent border-red-900/30 text-red-400 hover:bg-red-900/10": !onlyIrrelevant
                            }
                        )}
                    >
                        <Trash2 size={16} className={cn(onlyIrrelevant ? "text-red-500" : "text-red-400")} />
                        <span className="text-sm font-semibold">{status.irrelevant_count} Irrelevant</span>
                    </button>
                    
                </div>
            </div>

            <div className="bg-transparent p-6 rounded-2xl border border-[#334155] shadow-sm mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                    <Database size={20} className="text-indigo-600" />
                    Scraper Controls
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Target URL (e.g. helloworld.rs)"
                        className="flex-1 px-4 py-2 bg-transparent border border-[#334155] rounded-lg focus:ring-2 text-indigo-400 focus:ring-indigo-500 outline-none placeholder-gray-500"
                        value={scraperUrl}
                        onChange={(e) => setScraperUrl(e.target.value)}
                        disabled={isScraping}
                    />
                    {!isScraping ? (
                        <button
                            onClick={handleStartScraper}
                            disabled={!scraperUrl}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            <Play size={18} />
                            Start Scraping
                        </button>
                    ) : (
                        <button
                            onClick={handleStopScraper}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition"
                        >
                            <StopCircle size={18} />
                            Stop Scraper
                        </button>
                    )}
                </div>
                {isScraping && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 font-medium animate-pulse text-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        Scraper is currently running and searching for jobs...
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-8 items-stretch">
                <div className="flex-1 bg-transparent p-6 rounded-2xl border border-[#334155] shadow-sm flex flex-col justify-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search scraped jobs..."
                            className="w-full pl-10 pr-10 py-2.5 bg-transparent border border-[#334155] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-400 placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                style={{
                                    right:'1rem'
                                }}
                                className="absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-wrap gap-6 items-center bg-transparent p-6 rounded-2xl border border-[#334155] shadow-sm">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={14} className="text-indigo-400" /> 
                            Delete before date
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="flex-1 px-3 py-2 bg-transparent border border-[#334155] rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-white"
                                value={deleteBeforeDate}
                                onChange={(e) => setDeleteBeforeDate(e.target.value)}
                            />
                            <button
                                onClick={() => handleBulkDelete(false)}
                                disabled={!deleteBeforeDate}
                                className="bg-red-950/30 text-red-500 p-2.5 rounded-lg hover:bg-red-900/40 transition disabled:opacity-50 border border-red-900/50"
                                title="Delete jobs before date"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="h-12 w-px bg-slate-700 mx-2 hidden lg:block"></div>
                    
                    <button
                        onClick={() => handleBulkDelete(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold text-sm shadow-sm shadow-red-200 ml-auto whitespace-nowrap"
                    >
                        <Trash2 size={18} />
                        Delete All
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentJobs.map(job => (
                            <ScraperJobCard
                                key={job.id}
                                job={job}
                                onToggleUsed={handleToggleUsed}
                                onToggleIrrelevant={handleToggleIrrelevant}
                                onLinkApplication={handleLinkApplication}
                                onUnlinkApplication={handleUnlinkApplication}
                                onSearchApplications={handleSearchApplications}
                                isSelected={selectedJobId === job.id}
                                onSelect={handleSelectJob}
                            />
                        ))}
                        {jobs.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500 rounded-xl border-2 border-dashed">
                                No jobs found. Start a scraper or check your search terms.
                            </div>
                        )}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={jobs.length}
                        textColor="#1e293b"
                    />
                </>
            )}
        </div>
    );
}
