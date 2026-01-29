"use client";

import React, { useState, useEffect } from 'react';
import { JobCard } from '@cata/shared-ui';
import { ScrapedJob } from '@cata/shared-types';
import { Search, Database, StopCircle, Play } from 'lucide-react';

export default function ScrapedPage() {
    const [jobs, setJobs] = useState<ScrapedJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState({ status: 'stopped', job_count: 0 });
    const [scraperUrl, setScraperUrl] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isScraping, setIsScraping] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            let url = `${API_BASE_URL}/scraper/jobs?limit=100`;
            if (searchTerm) url += `&title=${encodeURIComponent(searchTerm)}`;

            const res = await fetch(url);
            const data = await res.json();
            setJobs(data);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/status`);
            const data = await res.json();
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
    }, [searchTerm]);

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

    const handleToggleFavorite = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/jobs/${id}/favorite`, { method: 'PATCH' });
            fetchJobs();
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Scraped Jobs</h1>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                        <Database size={16} className="text-gray-400" />
                        <span className="text-sm font-semibold">{status.job_count} Total</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database size={20} className="text-indigo-600" />
                    Scraper Controls
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Target URL (e.g. helloworld.rs)"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    <div className="mt-4 flex items-center gap-2 text-green-600 font-medium animate-pulse text-sm">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        Scraper is currently running and searching for jobs...
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search scraped jobs..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onToggleFavorite={handleToggleFavorite}
                            onToggleIrrelevant={handleToggleIrrelevant}
                        />
                    ))}
                    {jobs.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                            No jobs found. Start a scraper or check your search terms.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
