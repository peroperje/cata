import { API_BASE_URL } from '../constants';
import { FormField, AIResponse, MessageAction, AppStatus } from '@cata/shared-types';

export const useAutofill = (
    pdfText: string,
    selectedModelId: number | null,
    setStatus: (status: AppStatus) => void
) => {
    const sendMessageToActiveTab = async <T>(message: MessageAction): Promise<T> => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) throw new Error('No active tab found.');

        // Verify we are on a webpage (not a chrome:// or about:blank page)
        if (!tab.url?.startsWith('http')) {
            throw new Error('Please open a job application page first.');
        }

        try {
            return await chrome.tabs.sendMessage(tab.id, message);
        } catch (err: unknown) {
            const error = err as { message?: string };
            if (error.message?.includes('Could not establish connection')) {
                throw new Error('Extension connection lost. Please refresh the job application page and try again.');
            }
            throw err;
        }
    };

    const handleFill = async (instruction: string, jobApplicationId?: number) => {
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
            const fields = await sendMessageToActiveTab<FormField[]>({ type: 'SCRAPE_DOM' });

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
                    modelId: selectedModelId,
                    instruction: instruction,
                    jobApplicationId: jobApplicationId
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
        } catch (err) {
            console.error('Autofill error:', err);
            const message = err instanceof Error ? err.message : 'Workflow failed.';
            setStatus({ type: 'error', message });
        }
    };

    const checkStoredResult = async (jobApplicationId: number): Promise<boolean> => {
        try {
            const res = await fetch(`${API_BASE_URL}/autofill/${jobApplicationId}`);
            return res.ok;
        } catch {
            return false;
        }
    };

    const handleFillFromDatabase = async (jobApplicationId: number) => {
        setStatus({ type: 'loading', message: 'Fetching stored mappings...' });
        try {
            const res = await fetch(`${API_BASE_URL}/autofill/${jobApplicationId}`);
            if (!res.ok) throw new Error('Stored result not found');
            
            const data = await res.json();
            
            setStatus({ type: 'loading', message: 'Filling form...' });
            await sendMessageToActiveTab({
                type: 'FILL_FORM',
                mappings: data.result
            });

            setStatus({ type: 'success', message: 'Form filled from database!' });
        } catch (err) {
            console.error('Database autofill error:', err);
            const message = err instanceof Error ? err.message : 'Database fetch failed.';
            setStatus({ type: 'error', message });
        }
    };

    return { handleFill, handleFillFromDatabase, checkStoredResult };
};

