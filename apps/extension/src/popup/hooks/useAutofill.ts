import { API_BASE_URL } from '../constants';
import { FormField, AIResponse } from '../../types';

export const useAutofill = (
    pdfText: string,
    selectedModelId: number | null,
    setStatus: (status: any) => void
) => {
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

    return { handleFill };
};
