import React, { useState } from 'react';
import { Briefcase, List, Plus, Trash2, Edit2, CheckCircle, Clock, XCircle, Info } from 'lucide-react';
import { JobApplication } from '../../types';

interface JobsApplyTrackerProps {
    applications: JobApplication[];
    currentJob: { title: string; company: string; url: string };
    onAdd: (notes: string) => void;
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
    onAdd,
    onUpdateStatus,
    onDelete,
    onRefresh
}) => {
    const [notes, setNotes] = useState('');
    const statuses = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];

    const handleAdd = () => {
        onAdd(notes);
        setNotes('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Add New Section */}
            <div className="card">
                <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#6366f1' }}>Current Page Job:</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600' }}>{currentJob.title || 'No job detected'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{currentJob.company}</div>
                </div>

                <textarea
                    placeholder="Add some notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        marginBottom: '0.75rem',
                        fontSize: '0.85rem'
                    }}
                />

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="button" onClick={handleAdd} disabled={!currentJob.title} style={{ flex: 1 }}>
                        <Plus size={18} /> Add to Tracker
                    </button>
                    <button className="button" onClick={onRefresh} style={{ width: '40px', padding: '0' }} title="Reload metadata">
                        <Edit2 size={16} />
                    </button>
                </div>
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
                                    <h3 style={{ fontSize: '0.95rem', margin: 0, paddingRight: '2rem' }}>{app.title}</h3>
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
                                    <div style={{ fontSize: '0.8rem', backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem', borderLeft: '3px solid #e5e7eb' }}>
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
                                                border: `1px solid ${app.status === s ? statusColors[s] : '#e5e7eb'}`,
                                                backgroundColor: app.status === s ? statusColors[s] : 'white',
                                                color: app.status === s ? 'white' : '#6b7280',
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
