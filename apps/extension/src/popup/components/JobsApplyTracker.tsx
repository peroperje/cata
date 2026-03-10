import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { JobApplication, AppStatus } from '@cata/shared-types';
import { ApplicationCard, ConfirmModal } from '@cata/shared-ui';

interface JobsApplyTrackerProps {
    applications: JobApplication[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterStatus: string;
    onStatusFilterChange: (value: string) => void;
    currentJob: { title: string; company: string; url: string };
    isExtracting: boolean;
    isSaving: boolean;
    status: AppStatus;
    onAdd: (data: { title: string; company: string; notes: string }, force?: boolean) => void;
    onUpdateStatus: (id: number, status: string) => void;
    onUpdateNotes: (id: number, notes: string) => void;
    onDelete: (id: number) => void;
    onRefresh: () => void;
}

export const JobsApplyTracker: React.FC<JobsApplyTrackerProps> = ({
    applications,
    searchTerm,
    onSearchChange,
    filterStatus,
    onStatusFilterChange,
    currentJob,
    isExtracting,
    isSaving,
    status,
    onAdd,
    onUpdateStatus,
    onUpdateNotes,
    onDelete,
    onRefresh
}) => {
    const [title, setTitle] = useState(currentJob.title);
    const [company, setCompany] = useState(currentJob.company);
    const [notes, setNotes] = useState('');
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    const statuses = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];

    // Update local state when prop changes (e.g. after refresh/extract)
    useEffect(() => {
        setTitle(currentJob.title);
        setCompany(currentJob.company);
    }, [currentJob.title, currentJob.company]);

    const handleAdd = (force = false) => {
        onAdd({ title, company, notes }, force);
    };

    useEffect(() => {
        if (status.type === 'success') {
            setNotes('');
        }
    }, [status.type]);

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

                <button 
                    className="button" 
                    onClick={() => handleAdd(false)} 
                    disabled={isExtracting || isSaving} 
                    style={{ width: '100%' }}
                >
                    {isSaving ? <RefreshCw size={18} className="spin" /> : <Plus size={18} />}
                    {isSaving ? 'Saving...' : 'Add to Tracker'}
                </button>

                {status.type === 'error' && status.errorType === 'POTENTIAL_DUPLICATE' && (
                    <button 
                        className="button" 
                        onClick={() => onAdd({ title, company, notes }, true)} 
                        style={{ 
                            width: '100%', 
                            marginTop: '0.5rem', 
                            background: '#10b981', 
                            borderColor: '#10b981' 
                        }}
                    >
                        Save Anyway
                    </button>
                )}
            </div>

            {/* Filter & Search Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 2rem 0.5rem 2rem',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.85rem',
                            outline: 'none'
                        }}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {!searchTerm && (
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '2px',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap'
                    }}>
                        {statuses.map(s => (
                            <button
                                key={s}
                                onClick={() => onStatusFilterChange(s)}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    color: filterStatus === s ? '#6366f1' : '#6b7280',
                                    borderBottom: filterStatus === s ? '2px solid #6366f1' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* List Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {applications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem', fontSize: '0.85rem' }}>
                        No {searchTerm ? 'results' : filterStatus.toLowerCase() + ' applications'} found.
                    </div>
                ) : (
                    applications.map((app: JobApplication) => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            onUpdateStatus={onUpdateStatus}
                            onUpdateNotes={onUpdateNotes}
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
