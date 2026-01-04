import React, { useState, useEffect } from 'react';
import { Upload, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { extractTextFromPDF } from '../utils/pdf';
import {  FormField, AIResponse, AIModel } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [pdfText, setPdfText] = useState('');
    const [fileName, setFileName] = useState('');
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: '',
    });

    useEffect(() => {
        chrome.storage.local.get(['cv_text', 'cv_filename', 'selected_model_id'], (result) => {
            if (result.cv_text) setPdfText(result.cv_text);
            if (result.cv_filename) setFileName(result.cv_filename);
            if (result.selected_model_id) setSelectedModelId(result.selected_model_id);
        });
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/models`);
            const data = await res.json();
            setModels(data);
            if (data.length > 0 && !selectedModelId) {
                setSelectedModelId(data[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch models', err);
        }
    };

    const saveApiKey = async () => {
        if (!selectedModelId || !apiKey) return;
        setStatus({ type: 'loading', message: 'Saving API Key...' });
        try {
            const res = await fetch(`${API_BASE_URL}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_id: selectedModelId, api_key: apiKey }),
            });
            if (!res.ok) throw new Error('Failed to save key');
            setStatus({ type: 'success', message: 'API Key saved to backend!' });
            setApiKey('');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const handleFill = async () => {
        if (!pdfText) {
            setStatus({ type: 'error', message: 'Please upload a CV first.' });
            return;
        }
        if (!selectedModelId) {
            setStatus({ type: 'error', message: 'Please select an AI model.' });
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

            setStatus({ type: 'loading', message: 'AI is mapping fields via API...' });

            // 3. Call API instead of Background
            const res = await fetch(`${API_BASE_URL}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cvText: pdfText,
                    formData: fields,
                    modelId: selectedModelId
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'API mapping failed');
            }

            const response: AIResponse = await res.json();

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus({ type: 'loading', message: 'Extracting PDF text...' });
        try {
            const text = await extractTextFromPDF(file);
            setPdfText(text);
            setFileName(file.name);
            chrome.storage.local.get(['cv_text'], (result) => {
                 chrome.storage.local.set({ cv_text: text, cv_filename: file.name });
            });
            setStatus({ type: 'success', message: `Extracted: ${file.name}` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to read PDF.' });
        }
    };

    return (
        <div className="container">
            <header>
                <h1>CATA - AI Job Filler - V2</h1>
            </header>

            <section className="card input-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    SELECT AI MODEL
                </label>
                <select
                    value={selectedModelId || ''}
                    onChange={(e) => {
                        const id = Number(e.target.value);
                        setSelectedModelId(id);
                        chrome.storage.local.set({ selected_model_id: id });
                    }}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                    ))}
                </select>

                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    MODEL API KEY
                </label>
                <div style={{ display: 'flex', flexDirection:'column', gap: '0.5rem' }}>
                    <input
                        type="password"
                        placeholder="Enter API Key for selected model"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button onClick={saveApiKey} className="button" >
                        Save
                    </button>
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
