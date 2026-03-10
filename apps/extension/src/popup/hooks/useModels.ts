import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { AIModel, AppStatus } from '@cata/shared-types';

export const useModels = (setStatus: (status: AppStatus) => void) => {
    const [models, setModels] = useState<AIModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [apiKey, setApiKey] = useState('');

    const fetchModels = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/models`);
            const data: AIModel[] = await res.json();
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
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save key';
            setStatus({ type: 'error', message });
        }
    };

    const handleModelChange = (id: number | null) => {
        setSelectedModelId(id);
        if (id) {
            chrome.storage.local.set({ selected_model_id: id });
        } else {
            chrome.storage.local.remove('selected_model_id');
        }
    };

    const addModel = async (name: string, provider: string, modelName: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/models`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, provider, model_name: modelName }),
            });
            if (!res.ok) throw new Error('Failed to add model');
            const data: AIModel = await res.json();
            setModels(prev => [...prev, data]);
            setStatus({ type: 'success', message: 'Model added!' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add model';
            setStatus({ type: 'error', message });
        }
    };

    const deleteModel = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/models/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete model');
            setModels(prev => prev.filter(m => m.id !== id));
            if (selectedModelId === id) {
                setSelectedModelId(null);
                chrome.storage.local.remove('selected_model_id');
            }
            setStatus({ type: 'success', message: 'Model deleted!' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete model';
            setStatus({ type: 'error', message });
        }
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
        handleModelChange,
        addModel,
        deleteModel
    };
};
