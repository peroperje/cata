import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { ScrapedJob, AppStatus, ScraperStatus, JobApplication } from '@cata/shared-types';

export const useScraper = (setStatus: (status: AppStatus) => void, isExpanded: boolean) => {
    const [scraperUrl, setScraperUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [jobCount, setJobCount] = useState<number | null>(null);
    const [initialJobCount, setInitialJobCount] = useState<number>(0);
    const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([]);

    const checkScraperStatus = async (): Promise<ScraperStatus | null> => {
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/status`);
            const data: ScraperStatus = await res.json();
            setIsScraping(data.status === 'running');
            setJobCount(data.job_count);
            return data;
        } catch (err) {
            console.error('Failed to check scraper status', err);
            return null;
        }
    };

    const fetchScrapedJobs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/jobs`);
            const data: ScrapedJob[] = await res.json();
            setScrapedJobs(data);
        } catch (err) {
            console.error('Failed to fetch scraped jobs', err);
        }
    };

    const handleStartScraping = async () => {
        if (!scraperUrl) return;
        setStatus({ type: 'loading', message: 'Starting scraper...' });
        try {
            setInitialJobCount(jobCount || 0);
            const res = await fetch(`${API_BASE_URL}/scraper/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scraperUrl }),
            });
            if (!res.ok) throw new Error('Failed to start scraper');
            setIsScraping(true);
            setStatus({ type: 'success', message: 'Scraper started!' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start scraper';
            setStatus({ type: 'error', message });
        }
    };

    const handleStopScraping = async () => {
        setStatus({ type: 'loading', message: 'Stopping scraper...' });
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/stop`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to stop scraper');
            setIsScraping(false);

            setTimeout(async () => {
                const data = await checkScraperStatus();
                await fetchScrapedJobs();
                const freshJobCount = data?.job_count || 0;
                const inserted = freshJobCount - initialJobCount;
                setStatus({ type: 'success', message: `Stopped. Inserted ${inserted > 0 ? inserted : 0} records.` });
            }, 1000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to stop scraper';
            setStatus({ type: 'error', message });
        }
    };

    useEffect(() => {
        if (!isExpanded) return;

        checkScraperStatus();
        fetchScrapedJobs();

        const interval = setInterval(() => {
            checkScraperStatus().then(data => {
                if (data?.status === 'running') {
                    fetchScrapedJobs();
                }
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [isExpanded]);

    const toggleIrrelevant = async (jobId: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/irrelevant`, {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to update job');
            await fetchScrapedJobs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update job';
            setStatus({ type: 'error', message });
        }
    };

    const toggleUsed = async (jobId: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/used`, {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to update job');
            await fetchScrapedJobs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update job';
            setStatus({ type: 'error', message });
        }
    };

    const linkApplication = async (jobId: number, application_id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/link/${application_id}`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to link application');
            await fetchScrapedJobs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to link application';
            setStatus({ type: 'error', message });
        }
    };

    const unlinkApplication = async (jobId: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/unlink`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to unlink application');
            await fetchScrapedJobs();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unlink application';
            setStatus({ type: 'error', message });
        }
    };

    const searchApplications = async (query: string): Promise<JobApplication[]> => {
        try {
            const res = await fetch(`${API_BASE_URL}/job-applications?search=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('Failed to search applications:', err);
            return [];
        }
    };

    return {
        scraperUrl,
        setScraperUrl,
        isScraping,
        jobCount,
        scrapedJobs,
        handleStartScraping,
        handleStopScraping,
        toggleIrrelevant,
        toggleUsed,
        linkApplication,
        unlinkApplication,
        searchApplications
    };
};
