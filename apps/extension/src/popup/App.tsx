import React, { useState, useEffect } from 'react';
import { Upload, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { extractTextFromPDF } from '../utils/pdf';
import { MessageAction, FormField, AIResponse } from '../types';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [pdfText, setPdfText] = useState('');
    const [fileName, setFileName] = useState('');
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: '',
    });

    useEffect(() => {
        chrome.storage.local.get(['gemini_api_key', 'cv_text', 'cv_filename'], (result) => {
            if (result.gemini_api_key) setApiKey(result.gemini_api_key);
            if (result.cv_text) setPdfText(result.cv_text);
            if (result.cv_filename) setFileName(result.cv_filename);
        });
    }, []);

    const saveApiKey = (val: string) => {
        setApiKey(val);
        chrome.storage.local.set({ gemini_api_key: val });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus({ type: 'loading', message: 'Extracting PDF text...' });
        try {
            const text = await extractTextFromPDF(file);
            setPdfText(text);
            setFileName(file.name);
            chrome.storage.local.set({ cv_text: text, cv_filename: file.name });
            setStatus({ type: 'success', message: `Extracted: ${file.name}` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to read PDF.' });
        }
    };

    const handleFill = async () => {
        if (!pdfText) {
            setStatus({ type: 'error', message: 'Please upload a CV first.' });
            return;
        }
        if (!apiKey) {
            setStatus({ type: 'error', message: 'Please set Gemini API Key.' });
            return;
        }

        setStatus({ type: 'loading', message: 'Scraping form fields...' });

        try {
            // 1. Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) throw new Error('No active tab');

            // 2. Scrape DOM
            const fields: FormField[] = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_DOM' });

            if (!fields || fields.length === 0) {
                setStatus({ type: 'error', message: 'No form fields found on this page.' });
                return;
            }

            setStatus({ type: 'loading', message: 'AI is mapping fields...' });

            // 3. Send to Background for Gemini processing
            const response = await chrome.runtime.sendMessage({
                type: 'PROCESS_AI',
                cvText: pdfText,
                formData: fields
            });

            if (response.type === 'AI_ERROR') {
                throw new Error(response.error);
            }

            // 4. Send mappings back to Content Script to fill
            setStatus({ type: 'loading', message: 'Filling form...' });
            await chrome.tabs.sendMessage(tab.id, {
                type: 'FILL_FORM',
                mappings: response.mappings
            });

            setStatus({ type: 'success', message: 'Form filled successfully!' });
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', message: err.message || 'Workflow failed.' });
        }
    };

    return (
        <div className="container">
            <header>
                <h1>AI Job Auto-Filler - V1</h1>
            </header>

            <section className="card input-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    GEMINI API KEY
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="password"
                        placeholder="Set API Key"
                        value={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                        style={{ flex: 1 }}
                    />
                </div>
            </section>

            <section className="card">
                <label className="upload-zone" htmlFor="cv-upload">
                    <Upload size={24} style={{ marginBottom: '0.5rem', color: 'var(--primary)' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>
                        {fileName || 'Upload CV (PDF)'}
                    </p>
                    <input
                        id="cv-upload"
                        type="file"
                        className="file-input"
                        accept=".pdf"
                        onChange={handleFileUpload}
                    />
                </label>
            </section>

            <button
                className="button"
                onClick={handleFill}
                disabled={status.type === 'loading'}
            >
                <Zap size={18} fill="currentColor" />
                {status.type === 'loading' ? 'Processing...' : 'Auto-Fill Page'}
            </button>

            {status.message && (
                <div className={`status ${status.type}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {status.type === 'success' && <CheckCircle size={14} color="#10b981" />}
                    {status.type === 'error' && <AlertCircle size={14} color="#ef4444" />}
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default App;
