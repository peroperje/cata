import React, { useState } from 'react';
import { Search, Database, StopCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrapedJob } from '@cata/shared-types';
import { JobCard } from '@cata/shared-ui';

interface ScraperSectionProps {
    isScraping: boolean;
    scraperUrl: string;
    jobCount: number | null;
    scrapedJobs: ScrapedJob[];
    onUrlChange: (url: string) => void;
    onStartScraping: () => void;
    onStopScraping: () => void;
    onToggleIrrelevant: (id: number) => void;
    onToggleFavorite: (id: number) => void;
    isLoading: boolean;
}

export const ScraperSection: React.FC<ScraperSectionProps> = ({
    isScraping,
    scraperUrl,
    jobCount,
    scrapedJobs,
    onUrlChange,
    onStartScraping,
    onStopScraping,
    onToggleIrrelevant,
    onToggleFavorite,
    isLoading
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const visibleJobs = scrapedJobs.filter(job => !job.is_irrelevant);
    const totalPages = Math.ceil(visibleJobs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentJobs = visibleJobs.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!isScraping ? (
                    <>
                        <input
                            type="text"
                            placeholder="Target URL (e.g. helloworld.rs)"
                            value={scraperUrl}
                            onChange={(e) => onUrlChange(e.target.value)}
                        />
                        <button className="button" onClick={onStartScraping} disabled={!scraperUrl || isLoading}>
                            <Search size={18} />
                            Start Crawling
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', padding: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div className="pulse" style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Scraping active...</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Database size={12} />
                                Total Jobs: {jobCount || 0}
                            </div>
                        </div>
                        <button className="button" onClick={onStopScraping} style={{ background: '#ef4444' }}>
                            <StopCircle size={18} />
                            Stop Scraper
                        </button>
                    </>
                )}
            </div>

            {scrapedJobs.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h2 style={{ margin: 0 }}>Scraped Data</h2>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            {visibleJobs.length} Results
                        </span>
                    </div>
                    <div
                        className="custom-scrollbar"
                        style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            paddingRight: '6px'
                        }}
                    >
                        {currentJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onToggleFavorite={onToggleFavorite}
                                onToggleIrrelevant={onToggleIrrelevant}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '1rem',
                            padding: '0.5rem',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <button
                                className="button-icon"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '4px' }}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, visibleJobs.length)} of {visibleJobs.length}
                                </span>
                            </div>

                            <button
                                className="button-icon"
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '4px' }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
