import React from 'react';
import { Upload } from 'lucide-react';
import { CV } from '@cata/shared-types';

interface CvSectionProps {
    fileName: string;
    cvs: CV[];
    selectedCvId: number | null;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCvSelect: (cvId: number) => void;
}

export const CvSection: React.FC<CvSectionProps> = ({
    fileName,
    cvs,
    selectedCvId,
    onFileUpload,
    onCvSelect
}) => {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <section>
                <label className="upload-zone" htmlFor="cv-upload">
                    <Upload size={18} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{fileName || 'Upload CV (PDF)'}</span>
                    <input id="cv-upload" type="file" className="file-input" accept=".pdf" onChange={onFileUpload} />
                </label>

                {cvs.length > 0 && (
                    <select
                        value={selectedCvId || ''}
                        onChange={(e) => onCvSelect(Number(e.target.value))}
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                        {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.filename}</option>)}
                    </select>
                )}
            </section>
        </div>
    );
};
