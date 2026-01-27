import React, { useState, useEffect } from 'react';
import { Upload, Zap, CheckCircle, AlertCircle, Search, StopCircle, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { extractTextFromPDF } from '../utils/pdf';
import { FormField, AIResponse, AIModel, CV, ScrapedJob } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [pdfText, setPdfText] = useState('');
    const [fileName, setFileName] = useState('');
    const [models, setModels] = useState<AIModel[]>([]);
    const [cvs, setCvs] = useState<CV[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: '',
    });

    // Scraper State
    const [scraperUrl, setScraperUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [jobCount, setJobCount] = useState<number | null>(null);
    const [initialJobCount, setInitialJobCount] = useState<number>(0);
    const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([]);

    useEffect(() => {
        chrome.storage.local.get(['selected_model_id'], (result) => {
            if (result.selected_model_id) setSelectedModelId(result.selected_model_id);
        });
        fetchModels();
        fetchCVs();
        checkScraperStatus();
        fetchScrapedJobs();

        // Polling for scraper status if scraping
        const interval = setInterval(() => {
            checkScraperStatus().then(data => {
                if (data?.status === 'running') {
                    fetchScrapedJobs();
                }
            });
        }, 5000);
        return () => clearInterval(interval);
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

    const checkScraperStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/status`);
            const data = await res.json();
            setIsScraping(data.status === 'running');
            setJobCount(data.job_count);
            return data;
        } catch (err) {
            console.error('Failed to check scraper status', err);
            return null;
        }
    };


    const fetchScrapedJobs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/jobs`);
            const data = await res.json();
            setScrapedJobs(data);
        } catch (err) {
            console.error('Failed to fetch scraped jobs', err);
        }
    };

    const handleStartScraping = async () => {
        if (!scraperUrl) return;
        setStatus({ type: 'loading', message: 'Starting scraper...' });
        try {
            setInitialJobCount(jobCount || 0);
            const res = await fetch(`${API_BASE_URL}/scraper/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scraperUrl }),
            });
            if (!res.ok) throw new Error('Failed to start scraper');
            setIsScraping(true);
            setStatus({ type: 'success', message: 'Scraper started!' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const handleStopScraping = async () => {
        setStatus({ type: 'loading', message: 'Stopping scraper...' });
        try {
            const res = await fetch(`${API_BASE_URL}/scraper/stop`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to stop scraper');
            setIsScraping(false);

            // Wait a bit for the last items to process, then fetch status and jobs
            setTimeout(async () => {
                const data = await checkScraperStatus();
                await fetchScrapedJobs();
                const freshJobCount = data?.job_count || 0;
                const inserted = freshJobCount - initialJobCount;
                setStatus({ type: 'success', message: `Stopped. Inserted ${inserted > 0 ? inserted : 0} records.` });
            }, 1000);


        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
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
            setStatus({ type: 'success', message: 'API Key saved!' });
            setApiKey('');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const handleFill = async () => {
        if (!pdfText) {
            setStatus({ type: 'error', message: 'Select a CV first.' });
            return;
        }
        if (!selectedModelId) {
            setStatus({ type: 'error', message: 'Select an AI model.' });
            return;
        }

        setStatus({ type: 'loading', message: 'Scraping form fields...' });
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) throw new Error('No active tab');

            const fields: FormField[] = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_DOM' });
            if (!fields || fields.length === 0) {
                setStatus({ type: 'error', message: 'No fields found.' });
                return;
            }

            setStatus({ type: 'loading', message: 'AI is mapping fields...' });
            const res = await fetch(`${API_BASE_URL}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cvText: pdfText,
                    formData: fields,
                    modelId: selectedModelId
                })
            });

            if (!res.ok) throw new Error('Mapping failed');
            const data: AIResponse = await res.json();

            setStatus({ type: 'loading', message: 'Filling form...' });
            await chrome.tabs.sendMessage(tab.id, {
                type: 'FILL_FORM',
                mappings: data.mappings
            });

            setStatus({ type: 'success', message: 'Form filled!' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Workflow failed.' });
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

    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        cv: true,
        autofill: false,
        scraper: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="container">
            <header>
                <h1>CATA - AI Job Suite</h1>
            </header>

            {status.message && (
                <div className={`status ${status.type}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                    {status.type === 'success' && <CheckCircle size={14} color="#10b981" />}
                    {status.type === 'error' && <AlertCircle size={14} color="#ef4444" />}
                    {status.type === 'loading' && <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--text-muted)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
                    <span style={{ fontWeight: 500 }}>{status.message}</span>
                </div>
            )}

            {/* CV Section */}
            <h2 className="collapsible-header" onClick={() => toggleSection('cv')}>
                <span>Manage CV</span>
                {expandedSections.cv ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </h2>
            <div className={`collapsible-content ${expandedSections.cv ? 'expanded' : 'collapsed'}`}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <section>
                        <label className="upload-zone" htmlFor="cv-upload">
                            <Upload size={18} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{fileName || 'Upload CV (PDF)'}</span>
                            <input id="cv-upload" type="file" className="file-input" accept=".pdf" onChange={handleFileUpload} />
                        </label>

                        {cvs.length > 0 && (
                            <select
                                value={selectedCvId || ''}
                                onChange={(e) => handleCvSelect(Number(e.target.value))}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.filename}</option>)}
                            </select>
                        )}
                    </section>
                </div>
            </div>

            {/* Autofill Section */}
            <h2 className="collapsible-header" onClick={() => toggleSection('autofill')}>
                <span>Autofill Page</span>
                {expandedSections.autofill ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </h2>
            <div className={`collapsible-content ${expandedSections.autofill ? 'expanded' : 'collapsed'}`}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <select
                            value={selectedModelId || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                setSelectedModelId(id);
                                chrome.storage.local.set({ selected_model_id: id });
                            }}
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="password"
                                placeholder="API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button onClick={saveApiKey} className="button" style={{ width: 'auto' }}>
                                Save
                            </button>
                        </div>
                    </section>

                    <button className="button" onClick={handleFill} disabled={status.type === 'loading'}>
                        <Zap size={18} fill="currentColor" />
                        Fill Form
                    </button>
                </div>
            </div>

            {/* Scraper Section */}
            <h2 className="collapsible-header" onClick={() => toggleSection('scraper')}>
                <span>Scraper</span>
                {expandedSections.scraper ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </h2>
            <div className={`collapsible-content ${expandedSections.scraper ? 'expanded' : 'collapsed'}`}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isScraping ? (
                        <>
                            <input
                                type="text"
                                placeholder="Target URL (e.g. helloworld.rs)"
                                value={scraperUrl}
                                onChange={(e) => setScraperUrl(e.target.value)}
                            />
                            <button className="button" onClick={handleStartScraping} disabled={!scraperUrl || status.type === 'loading'}>
                                <Search size={18} />
                                Start Crawling
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', padding: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="pulse" style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Scraping active...</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Database size={12} />
                                    Total Jobs: {jobCount || 0}
                                </div>
                            </div>
                            <button className="button" onClick={handleStopScraping} style={{ background: '#ef4444' }}>
                                <StopCircle size={18} />
                                Stop Scraper
                            </button>
                        </>
                    )}
                </div>
                {/* Scraped Jobs List */}
                {scrapedJobs.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h2 style={{ margin: 0 }}>Scraped Data</h2>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                {scrapedJobs.length} Results
                            </span>
                        </div>
                        <div
                            className="custom-scrollbar"
                            style={{
                                maxHeight: '250px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                paddingRight: '6px'
                            }}
                        >
                            {scrapedJobs.map((job) => (
                                <div key={job.id} className="card job-card" style={{ padding: '0.75rem', fontSize: '0.85rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <a href={job.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', flex: 1, marginRight: '0.5rem' }}>
                                            {job.title}
                                        </a>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {job.similarity_score > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', flex: 1 }}>
                                                <div style={{ width: `${job.similarity_score * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                                            </div>
                                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{(job.similarity_score * 100).toFixed(0)}% Match</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>




            <style>{`
                .collapsible-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    padding: 0.5rem 0;
                    user-select: none;
                    transition: color 0.2s;
                }
                .collapsible-header:hover {
                    color: var(--text);
                }
                .collapsible-content {
                    overflow: hidden;
                    transition: max-height 0.3s ease-out, opacity 0.3s ease-out, margin 0.3s ease-out;
                }
                .collapsible-content.expanded {
                    max-height: 500px;
                    opacity: 1;
                    margin-bottom: 0.5rem;
                }
                .collapsible-content.collapsed {
                    max-height: 0;
                    opacity: 0;
                    margin-bottom: 0;
                    pointer-events: none;
                }
                .job-card:hover { border-color: var(--primary); transform: translateY(-1px); background: rgba(255,255,255,0.05); }
                .pulse { animation: pulse-animation 2s infinite; }
                @keyframes pulse-animation { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
            `}</style>
        </div >
    );
};


export default App;

