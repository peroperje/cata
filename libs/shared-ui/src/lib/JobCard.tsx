import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { ScrapedJob } from '@cata/shared-types';

interface JobCardProps {
    job: ScrapedJob;
    onToggleFavorite: (id: number) => void;
    onToggleIrrelevant: (id: number) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onToggleFavorite, onToggleIrrelevant }) => {
    return (
        <div className={`card job-card ${job.is_irrelevant ? 'opacity-50 grayscale' : ''}`} style={{ padding: '0.75rem', fontSize: '0.85rem', transition: 'transform 0.2s', cursor: 'pointer', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, paddingRight: '2rem' }}>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {job.title}
                    </a>
                </h3>
                <div style={{ display: 'flex', gap: '0.4rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(job.id); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: job.is_favorite ? '#fbbf24' : 'var(--text-muted)', opacity: job.is_favorite ? 1 : 0.4 }}
                        title={job.is_favorite ? "Remove from favorites" : "Mark as favorite"}
                    >
                        <Star size={16} fill={job.is_favorite ? "#fbbf24" : "none"} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleIrrelevant(job.id); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ef4444', opacity: 0.4 }}
                        title="Mark as irrelevant"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                {job.similarity_score !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', flex: 1 }}>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', flex: 1, maxWidth: '100px' }}>
                            <div style={{ width: `${job.similarity_score * 100}%`, height: '100%', background: job.is_irrelevant ? '#64748b' : 'var(--primary)' }}></div>
                        </div>
                        <span style={{ color: job.is_irrelevant ? '#64748b' : 'var(--primary)', fontWeight: 600 }}>{(job.similarity_score * 100).toFixed(0)}% Similarity</span>
                    </div>
                )}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(job.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};
