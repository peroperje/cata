import React from 'react';
import { LucideIcon, Trash2, Info, CheckCircle, Clock, Briefcase, XCircle } from 'lucide-react';
import { JobApplication } from '@cata/shared-types';

interface ApplicationCardProps {
    app: JobApplication;
    onUpdateStatus: (id: number, status: string) => void;
    onDeleteClick: (id: number) => void;
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

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ app, onUpdateStatus, onDeleteClick }) => {
    const Icon = statusIcons[app.status] || Info;

    return (
        <div className="card" style={{ padding: '0.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, paddingRight: '2rem' }}>
                    <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        {app.title}
                    </a>
                </h3>
                <button
                    onClick={() => onDeleteClick(app.id)}
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
};
