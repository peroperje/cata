import { API_BASE_URL } from '../constants';
import { FormField, AIResponse, MessageAction } from '@cata/shared-types';

export const useAutofill = (
    pdfText: string,
    selectedModelId: number | null,
    setStatus: (status: any) => void
) => {
    const sendMessageToActiveTab = async (message: MessageAction): Promise<any> => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) throw new Error('No active tab found.');

        // Verify we are on a webpage (not a chrome:// or about:blank page)
        if (!tab.url?.startsWith('http')) {
            throw new Error('Please open a job application page first.');
        }

        try {
            return await chrome.tabs.sendMessage(tab.id, message);
        } catch (err: any) {
            if (err.message.includes('Could not establish connection')) {
                throw new Error('Extension connection lost. Please refresh the job application page and try again.');
            }
            throw err;
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
            const fields: FormField[] = await sendMessageToActiveTab({ type: 'SCRAPE_DOM' });

            if (!fields || fields.length === 0) {
                setStatus({ type: 'error', message: 'No fields found on this page.' });
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

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Mapping failed');
            }

            const data: AIResponse = await res.json();

            setStatus({ type: 'loading', message: 'Filling form...' });
            await sendMessageToActiveTab({
                type: 'FILL_FORM',
                mappings: data.mappings
            });

            setStatus({ type: 'success', message: 'Form filled successfully!' });
        } catch (err: any) {
            console.error('Autofill error:', err);
            setStatus({ type: 'error', message: err.message || 'Workflow failed.' });
        }
    };

    return { handleFill };
};
