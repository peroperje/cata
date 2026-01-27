import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { CV } from '../../types';
import { extractTextFromPDF } from '../../utils/pdf';

export const useCvs = (setStatus: (status: any) => void) => {
    const [cvs, setCvs] = useState<CV[]>([]);
    const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
    const [pdfText, setPdfText] = useState('');
    const [fileName, setFileName] = useState('');

    const fetchCVs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/cvs`);
            const data = await res.json();
            setCvs(data);
            if (data.length > 0) {
                const latest = data[0];
                setSelectedCvId(latest.id);
                setPdfText(latest.text);
                setFileName(latest.filename);
            }
        } catch (err) {
            console.error('Failed to fetch CVs', err);
        }
    };

    const handleCvSelect = (cvId: number) => {
        const cv = cvs.find(c => c.id === cvId);
        if (cv) {
            setSelectedCvId(cv.id);
            setPdfText(cv.text);
            setFileName(cv.filename);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus({ type: 'loading', message: 'Uploading...' });
        try {
            const text = await extractTextFromPDF(file);
            const res = await fetch(`${API_BASE_URL}/cvs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, text: text }),
            });
            if (!res.ok) throw new Error('Save failed');
            const newCv: CV = await res.json();
            setCvs(prev => [...prev, newCv]);
            setSelectedCvId(newCv.id);
            setPdfText(newCv.text);
            setFileName(newCv.filename);
            setStatus({ type: 'success', message: `Saved: ${file.name}` });
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to process PDF.' });
        }
    };

    useEffect(() => {
        fetchCVs();
    }, []);

    return {
        cvs,
        selectedCvId,
        pdfText,
        fileName,
        handleCvSelect,
        handleFileUpload
    };
};
