import React from 'react';
import { Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { CV } from '@cata/shared-types';

interface CvSectionProps {
    cvs: CV[];
    selectedCvId: number | null;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCvSelect: (cvId: number) => void;
    onDeleteCv: (cvId: number) => void;
}

export const CvSection: React.FC<CvSectionProps> = ({
    cvs,
    selectedCvId,
    onFileUpload,
    onCvSelect,
    onDeleteCv
}) => {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <section>
                <label className="upload-zone" htmlFor="cv-upload">
                    <Upload size={18} style={{ color: '#6366f1' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Upload New CV (PDF)</span>
                    <input id="cv-upload" type="file" className="file-input" accept=".pdf" onChange={onFileUpload} style={{ display: 'none' }} />
                </label>

                {cvs.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.25rem' }}>Your CVs:</div>
                        {cvs.map(cv => (
                            <div
                                key={cv.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    backgroundColor: selectedCvId === cv.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${selectedCvId === cv.id ? '#6366f1' : 'transparent'}`,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        flex: 1,
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => onCvSelect(cv.id)}
                                >
                                    <CheckCircle2
                                        size={16}
                                        style={{
                                            color: selectedCvId === cv.id ? '#6366f1' : '#4b5563',
                                            flexShrink: 0
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '0.85rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        color: selectedCvId === cv.id ? '#1e293b' : '#64748b'
                                    }}>
                                        {cv.filename}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteCv(cv.id);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s'
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
