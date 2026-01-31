import React from 'react';
import { Star, Trash2, Link, Unlink, Search, Loader2 } from 'lucide-react';
import { ScrapedJob, JobApplication } from '@cata/shared-types';

interface JobCardProps {
    job: ScrapedJob;
    onToggleUsed: (id: number) => void;
    onToggleIrrelevant: (id: number) => void;
    onLinkApplication?: (jobId: number, applicationId: number) => Promise<void>;
    onUnlinkApplication?: (jobId: number) => Promise<void>;
    onSearchApplications?: (query: string) => Promise<JobApplication[]>;
    isSelected?: boolean;
    onSelect?: (id: number) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ 
    job, 
    onToggleUsed, 
    onToggleIrrelevant,
    onLinkApplication,
    onUnlinkApplication,
    onSearchApplications,
    isSelected,
    onSelect
}) => {
    const [isManageOpen, setIsManageOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [applications, setApplications] = React.useState<JobApplication[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);

    const isIrrelevant = !!job.is_irrelevant;

    const handleSelect = (e: React.MouseEvent) => {
        // Don't select if clicking on interactive elements
        if (onSelect) {
            onSelect(job.id);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!onSearchApplications) return;
        
        setIsSearching(true);
        try {
            const results = await onSearchApplications(query);
            setApplications(results);
        } catch (error) {
            console.error('Failed to search applications:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleManage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextOpen = !isManageOpen;
        setIsManageOpen(nextOpen);
        
        if (nextOpen && onSearchApplications) {
            // Default search based on job info
            const defaultQuery = `${job.title} ${job.url}`.substring(0, 50);
            setSearchQuery(defaultQuery);
            handleSearch(defaultQuery);
        }
    };

    const handleLink = async (e: React.MouseEvent, appId: number) => {
        e.stopPropagation();
        if (onLinkApplication) {
            await onLinkApplication(job.id, appId);
            setIsManageOpen(false);
        }
    };

    const handleUnlink = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUnlinkApplication) {
            await onUnlinkApplication(job.id);
        }
    };

    return (
        <div 
            className={`card job-card ${isIrrelevant ? 'opacity-50 grayscale' : ''} ${isSelected ? 'selected' : ''}`} 
            onClick={handleSelect}
            style={{ 
                padding: '0.75rem', 
                fontSize: '0.85rem', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                cursor: 'pointer', 
                position: 'relative',
                border: isSelected ? '2px solid var(--primary, #6366f1)' : '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                transform: isSelected ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
                zIndex: isSelected ? 10 : 1,
                background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--card-bg, #1e293b)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <span style={{
                    backgroundColor: isIrrelevant ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: isIrrelevant ? '#f87171' : '#4ade80',
                    fontSize: '0.6rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    border: `1px solid ${isIrrelevant ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                }}>
                    {isIrrelevant ? 'Irrelevant' : 'Relevant'}
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, paddingRight: '2rem' }}>
                    <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {job.title}
                    </a>
                </h3>
                <div style={{ display: 'flex', gap: '0.4rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleUsed(job.id); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: job.is_used ? '#fbbf24' : 'var(--text-muted)', opacity: job.is_used ? 1 : 0.4 }}
                        title={job.is_used ? "Remove from used" : "Mark as used"}
                    >
                        <Star size={16} fill={job.is_used ? "#fbbf24" : "none"} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleIrrelevant(job.id); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isIrrelevant ? '#ef4444' : 'var(--text-muted)', opacity: isIrrelevant ? 1 : 0.4 }}
                        title={isIrrelevant ? "Mark as relevant" : "Mark as irrelevant"}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                {job.similarity_score !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', flex: 1 }}>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', flex: 1, maxWidth: '100px' }}>
                            <div style={{ width: `${job.similarity_score * 100}%`, height: '100%', background: isIrrelevant ? '#64748b' : 'var(--primary)' }}></div>
                        </div>
                        <span style={{ color: isIrrelevant ? '#64748b' : 'var(--primary)', fontWeight: 600 }}>{(job.similarity_score * 100).toFixed(0)}% Similarity</span>
                    </div>
                )}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(job.created_at).toLocaleDateString()}
                </span>
            </div>

            {/* Connection Information */}
            <div style={{ 
                marginTop: '0.75rem', 
                paddingTop: '0.75rem', 
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: job.job_application_id ? 'var(--primary, #6366f1)' : 'var(--text-muted)' }}>
                        {job.job_application_id ? (
                            <>
                                <Link size={14} />
                                <span style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {job.job_application?.company} - {job.job_application?.title}
                                </span>
                                <button 
                                    onClick={handleUnlink}
                                    style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                    title="Unlink"
                                >
                                    <Unlink size={12} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link size={14} style={{ opacity: 0.5 }} />
                                <span>No connection</span>
                            </>
                        )}
                    </div>
                    <button 
                        onClick={toggleManage}
                        style={{ 
                            background: isManageOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)', 
                            border: `1px solid ${isManageOpen ? 'var(--primary, #6366f1)' : 'rgba(255,255,255,0.1)'}`, 
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.7rem',
                            color: isManageOpen ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        {isManageOpen ? 'Close' : 'Link App'}
                    </button>
                </div>

                {isManageOpen && (
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            borderRadius: '8px', 
                            padding: '8px',
                            marginTop: '4px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search applications..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    padding: '4px 8px 4px 28px',
                                    fontSize: '0.75rem',
                                    color: '#fff',
                                    outline: 'none'
                                }}
                            />
                            {isSearching && (
                                <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            )}
                        </div>
                        
                        <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {applications.length > 0 ? applications.map(app => (
                                <div 
                                    key={app.id} 
                                    style={{ 
                                        padding: '6px', 
                                        borderRadius: '4px', 
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.7rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.title}</span>
                                        <span style={{ opacity: 0.7 }}>{app.company} • {new Date(app.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => handleLink(e, app.id)}
                                        style={{
                                            background: 'var(--primary, #6366f1)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '2px 8px',
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Link
                                    </button>
                                </div>
                            )) : !isSearching && (
                                <div style={{ textAlign: 'center', padding: '12px', opacity: 0.5, fontSize: '0.7rem' }}>No applications found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
