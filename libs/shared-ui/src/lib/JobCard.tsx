import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { ScrapedJob } from '@cata/shared-types';

interface JobCardProps {
    job: ScrapedJob;
    onToggleFavorite: (id: number) => void;
    onToggleIrrelevant: (id: number) => void;
    isSelected?: boolean;
    onSelect?: (id: number) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ 
    job, 
    onToggleFavorite, 
    onToggleIrrelevant,
    isSelected,
    onSelect
}) => {
    const isIrrelevant = !!job.is_irrelevant;

    const handleSelect = () => {
        if (onSelect) {
            onSelect(job.id);
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
                boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)' : 'none',
                transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                zIndex: isSelected ? 10 : 1,
                background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--card-bg, #1e293b)'
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
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(job.id); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: job.is_favorite ? '#fbbf24' : 'var(--text-muted)', opacity: job.is_favorite ? 1 : 0.4 }}
                        title={job.is_favorite ? "Remove from favorites" : "Mark as favorite"}
                    >
                        <Star size={16} fill={job.is_favorite ? "#fbbf24" : "none"} />
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
        </div>
    );
};
