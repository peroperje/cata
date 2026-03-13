"use client";

import React, { useState, useEffect } from 'react';
import { CvSection, AutofillSection } from '@cata/shared-ui';
import { CV, AIModel } from '@cata/shared-types';

export default function SettingsPage() {
    const [cvs, setCvs] = useState<CV[]>([]);
    const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const fetchCvs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/cvs`);
            const data = await res.json();
            setCvs(data);
        } catch (error) {
            console.error('Failed to fetch CVs', error);
        }
    };

    const fetchModels = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/models`);
            const data = await res.json();
            setModels(data);
        } catch (error) {
            console.error('Failed to fetch models', error);
        }
    };

    useEffect(() => {
        fetchCvs();
        fetchModels();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            // For now, in dashboard we'll just send the filename and a placeholder text
            // since setting up pdfjs-dist worker in Next.js is tricky in a quick refactor
            // and the user primarily wants the UI refactoring.
            const res = await fetch(`${API_BASE_URL}/cvs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    text: "Text extraction placeholder for dashboard. Use extension for full PDF processing."
                }),
            });
            if (res.ok) {
                fetchCvs();
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCvDelete = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/cvs/${id}`, { method: 'DELETE' });
            fetchCvs();
            if (selectedCvId === id) setSelectedCvId(null);
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleModelDelete = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/models/${id}`, { method: 'DELETE' });
            fetchModels();
            if (selectedModelId === id) setSelectedModelId(null);
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleSaveApiKey = async () => {
        if (!selectedModelId || !apiKey) return;
        try {
            await fetch(`${API_BASE_URL}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_id: selectedModelId, api_key: apiKey })
            });
            setApiKey('');
            fetchModels();
        } catch (error) {
            console.error('Save key failed', error);
        }
    };

    const handleAddModel = async (name: string, provider: string, modelName: string) => {
        try {
            await fetch(`${API_BASE_URL}/models`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, provider, model_name: modelName })
            });
            fetchModels();
        } catch (error) {
            console.error('Add model failed', error);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-2 text-lg">Manage your CVs and AI model configurations.</p>
            </div>

            <div className="grid grid-cols-1 gap-10">
                <div className="space-y-6">
                    <div className="bg-[#1e293b] p-8 rounded-2xl shadow-lg text-slate-100">
                        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                            Manage CVs
                        </h2>
                        <CvSection
                            cvs={cvs}
                            selectedCvId={selectedCvId}
                            onFileUpload={handleFileUpload}
                            onCvSelect={setSelectedCvId}
                            onDeleteCv={handleCvDelete}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#1e293b] p-8 rounded-2xl shadow-lg text-slate-100">
                        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                            AI Models & Autofill
                        </h2>
                        <AutofillSection
                            models={models}
                            selectedModelId={selectedModelId}
                            apiKey={apiKey}
                            onModelChange={setSelectedModelId}
                            onApiKeyChange={setApiKey}
                            onSaveApiKey={handleSaveApiKey}
                            onFill={() => {
                                alert("Autofill is only available within the browser extension on job application pages.");
                            }}
                            onFillFromDatabase={() => {
                                alert("Autofill is only available within the browser extension.");
                            }}
                            onCheckStoredResult={async () => false}
                            onAddModel={handleAddModel}
                            onDeleteModel={handleModelDelete}
                            isLoading={isLoading}
                            renderAutofillButton={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
