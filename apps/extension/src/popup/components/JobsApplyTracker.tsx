import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { JobApplication } from '@cata/shared-types';
import { ApplicationCard, ConfirmModal } from '@cata/shared-ui';

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
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    // Update local state when prop changes (e.g. after refresh/extract)
    useEffect(() => {
        setTitle(currentJob.title);
        setCompany(currentJob.company);
    }, [currentJob.title, currentJob.company]);

    const handleAdd = () => {
        onAdd({ title, company, notes });
        setNotes('');
    };

    const handleDeleteClick = (id: number) => {
        setIdToDelete(id);
    };

    const handleConfirmDelete = () => {
        if (idToDelete !== null) {
            onDelete(idToDelete);
            setIdToDelete(null);
        }
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
                    applications.map(app => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            onUpdateStatus={onUpdateStatus}
                            onDeleteClick={handleDeleteClick}
                        />
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={idToDelete !== null}
                onClose={() => setIdToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Application"
                message="Are you sure you want to delete this application? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};
