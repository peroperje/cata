import React from 'react';
import { LucideIcon, Trash2, Info, CheckCircle, Clock, Briefcase, XCircle, Edit2 } from 'lucide-react';
import { JobApplication } from '@cata/shared-types';

interface ApplicationCardProps {
    app: JobApplication;
    onUpdateStatus: (id: number, status: string) => void;
    onDeleteClick: (id: number) => void;
    onUpdateNotes?: (id: number, notes: string) => void;
    editLink?: React.ReactNode;
}

const statusColors: { [key: string]: string } = {
    'Interested': '#3b82f6',
    'Applied': '#10b981',
    'Interview': '#8b5cf6',
    'Offer': '#f59e0b',
    'Rejected': '#ef4444'
};

const statusIcons: { [key: string]: LucideIcon } = {
    'Interested': Info,
    'Applied': CheckCircle,
    'Interview': Clock,
    'Offer': Briefcase,
    'Rejected': XCircle
};

const statuses = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ app, onUpdateStatus, onDeleteClick, onUpdateNotes, editLink }) => {
    const [isEditingNotes, setIsEditingNotes] = React.useState(false);
    const [notes, setNotes] = React.useState(app.notes || '');
    const Icon = statusIcons[app.status] || Info;

    const handleSaveNotes = () => {
        if (onUpdateNotes) {
            onUpdateNotes(app.id, notes);
            setIsEditingNotes(false);
        }
    };

    const handleCancelNotes = () => {
        setNotes(app.notes || '');
        setIsEditingNotes(false);
    };

    return (
        <div className="card" style={{ padding: '0.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, paddingRight: '3rem' }}>
                    <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        {app.title}
                    </a>
                </h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {editLink}
                    <button
                        onClick={() => onDeleteClick(app.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
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

            {isEditingNotes ? (
                <div style={{ marginBottom: '0.75rem' }}>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem',
                            backgroundColor: '#1e293b',
                            color: 'white'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleCancelNotes}
                            style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #334155',
                                background: 'transparent',
                                color: '#94a3b8',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNotes}
                            style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                (app.notes || onUpdateNotes) && (
                    <div
                        onClick={() => onUpdateNotes && setIsEditingNotes(true)}
                        style={{
                            fontSize: '0.8rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#f8fafc',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginBottom: '0.75rem',
                            borderLeft: '3px solid #6366f1',
                            cursor: onUpdateNotes ? 'pointer' : 'default',
                            whiteSpace: 'pre-wrap',
                            minHeight: onUpdateNotes && !app.notes ? '20px' : 'auto'
                        }}
                    >
                        {app.notes || (onUpdateNotes && <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Add notes...</span>)}
                    </div>
                )
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
};
