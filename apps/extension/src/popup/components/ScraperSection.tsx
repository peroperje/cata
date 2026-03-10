import React, { useState } from 'react';
import { Search, Database, StopCircle } from 'lucide-react';
import { ScrapedJob } from '@cata/shared-types';
import { ScraperJobCard, Pagination, useJobSelection } from '@cata/shared-ui';

interface ScraperSectionProps {
    isScraping: boolean;
    scraperUrl: string;
    jobCount: number | null;
    scrapedJobs: ScrapedJob[];
    onUrlChange: (url: string) => void;
    onStartScraping: () => void;
    onStopScraping: () => void;
    onToggleIrrelevant: (id: number) => void;
    onToggleUsed: (id: number) => void;
    onLinkApplication?: (jobId: number, application_id: number) => Promise<void>;
    onUnlinkApplication?: (jobId: number) => Promise<void>;
    onSearchApplications?: (query: string) => Promise<any[]>;
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
    onToggleUsed,
    onLinkApplication,
    onUnlinkApplication,
    onSearchApplications,
    isLoading
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const { selectedJobId, handleSelectJob } = useJobSelection();
    const itemsPerPage = 3;

    const visibleJobs = scrapedJobs.filter(job => !job.is_irrelevant && !job.is_used);
    const totalPages = Math.ceil(visibleJobs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentJobs = visibleJobs.slice(indexOfFirstItem, indexOfLastItem);

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
                            gap: '0.75rem',
                            padding: '12px 8px',
                            margin: '0'
                        }}
                    >
                        {currentJobs.map((job) => (
                            <ScraperJobCard
                                key={job.id}
                                job={job}
                                onToggleUsed={onToggleUsed}
                                onToggleIrrelevant={onToggleIrrelevant}
                                onLinkApplication={onLinkApplication}
                                onUnlinkApplication={onUnlinkApplication}
                                onSearchApplications={onSearchApplications}
                                isSelected={selectedJobId === job.id}
                                onSelect={handleSelectJob}
                            />
                        ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={visibleJobs.length}
                    />
                </div>
            )}
        </>
    );
};
