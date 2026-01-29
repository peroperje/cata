import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { AIModel } from '@cata/shared-types';

export const useModels = (setStatus: (status: any) => void) => {
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [apiKey, setApiKey] = useState('');

    const fetchModels = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/models`);
            const data = await res.json();
            setModels(data);
            if (data.length > 0 && !selectedModelId) {
                // Check storage first
                chrome.storage.local.get(['selected_model_id'], (result) => {
                    if (result.selected_model_id) {
                        setSelectedModelId(result.selected_model_id);
                    } else {
                        setSelectedModelId(data[0].id);
                    }
                });
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
            setStatus({ type: 'success', message: 'API Key saved!' });
            setApiKey('');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const handleModelChange = (id: number) => {
        setSelectedModelId(id);
        chrome.storage.local.set({ selected_model_id: id });
    };

    useEffect(() => {
        fetchModels();
    }, []);

    return {
        models,
        selectedModelId,
        apiKey,
        setApiKey,
        saveApiKey,
        handleModelChange
    };
};
