import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { ScrapedJob } from '../../types';

export const useScraper = (setStatus: (status: any) => void, isExpanded: boolean) => {
    const [scraperUrl, setScraperUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [jobCount, setJobCount] = useState<number | null>(null);
    const [initialJobCount, setInitialJobCount] = useState<number>(0);
    const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([]);

    const checkScraperStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/status`);
            const data = await res.json();
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
            const data = await res.json();
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
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
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
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
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
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const toggleFavorite = async (jobId: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/favorite`, {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to update job');
            await fetchScrapedJobs();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
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
        toggleFavorite
    };
};
