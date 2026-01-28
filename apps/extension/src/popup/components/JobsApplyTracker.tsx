import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, CheckCircle, Clock, XCircle, Info, RefreshCw } from 'lucide-react';
import { JobApplication } from '../../types';

interface JobsApplyTrackerProps {
    applications: JobApplication[];
    currentJob: { title: string; company: string; url: string };
    isExtracting: boolean;
    isSaving: boolean;
    onAdd: (data: { title: string; company: string; notes: string }) => void;
    onUpdateStatus: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onRefresh: () => void;
}

const statusColors: { [key: string]: string } = {
    'Interested': '#3b82f6',
    'Applied': '#10b981',
    'Interview': '#8b5cf6',
    'Offer': '#f59e0b',
    'Rejected': '#ef4444'
};

const statusIcons: { [key: string]: any } = {
    'Interested': Info,
    'Applied': CheckCircle,
    'Interview': Clock,
    'Offer': Briefcase,
    'Rejected': XCircle
};

export const JobsApplyTracker: React.FC<JobsApplyTrackerProps> = ({
    applications,
    currentJob,
    isExtracting,
    isSaving,
    onAdd,
    onUpdateStatus,
    onDelete,
    onRefresh
}) => {
    const [title, setTitle] = useState(currentJob.title);
    const [company, setCompany] = useState(currentJob.company);
    const [notes, setNotes] = useState('');
    const statuses = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];

    // Update local state when prop changes (e.g. after refresh/extract)
    useEffect(() => {
        setTitle(currentJob.title);
        setCompany(currentJob.company);
    }, [currentJob.title, currentJob.company]);

    const handleAdd = () => {
        onAdd({ title, company, notes });
        setNotes('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Add New Section */}
            <div className="card">
                <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#6366f1' }}>Job Details:</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isExtracting && (
                                <div className="pulse" style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%' }}></div>
                                    Extracting...
                                </div>
                            )}
                            <button
                                onClick={onRefresh}
                                disabled={isExtracting || isSaving}
                                title="Extract from page"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6366f1',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                <RefreshCw size={14} className={isExtracting ? 'spin' : ''} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Job Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                </div>

                <textarea
                    placeholder="Add some notes (optional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        marginBottom: '0.75rem',
                        fontSize: '0.85rem'
                    }}
                />

                <button className="button" onClick={handleAdd} disabled={isExtracting || isSaving} style={{ width: '100%' }}>
                    {isSaving ? <RefreshCw size={18} className="spin" /> : <Plus size={18} />}
                    {isSaving ? 'Saving...' : 'Add to Tracker'}
                </button>
            </div>

            {/* List Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {applications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>No applications tracked yet.</div>
                ) : (
                    applications.map(app => {
                        const Icon = statusIcons[app.status] || Info;
                        return (
                            <div key={app.id} className="card" style={{ padding: '0.75rem', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', margin: 0, paddingRight: '2rem' }}>
                                        <a
                                            href={app.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'inherit', textDecoration: 'none' }}
                                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                        >
                                            {app.title}
                                        </a>
                                    </h3>
                                    <button
                                        onClick={() => onDelete(app.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>{app.company}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        backgroundColor: `${statusColors[app.status]}20`,
                                        color: statusColors[app.status],
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontWeight: '600'
                                    }}>
                                        <Icon size={12} /> {app.status}
                                    </span>
                                </div>

                                {app.notes && (
                                    <div style={{
                                        fontSize: '0.8rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: '#f8fafc',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        marginBottom: '0.75rem',
                                        borderLeft: '3px solid #6366f1'
                                    }}>
                                        {app.notes}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {statuses.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => onUpdateStatus(app.id, s)}
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                border: `1px solid ${app.status === s ? statusColors[s] : '#334155'}`,
                                                backgroundColor: app.status === s ? statusColors[s] : 'transparent',
                                                color: app.status === s ? 'white' : '#94a3b8',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
