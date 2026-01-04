import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageAction, AIResponse } from '../types';

async function callGemini(cvText: string, formData: any[]): Promise<AIResponse> {
    const result = await chrome.storage.local.get(['gemini_api_key']);
    const apiKey = result.gemini_api_key;

    if (!apiKey) {
        throw new Error('Gemini API Key not found. Please set it in the extension options.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
    You are an expert at mapping CV information to job application forms.
    
    CV TEXT:
    """
    ${cvText}
    """

    FORM FIELDS (JSON):
    """
    ${JSON.stringify(formData, null, 2)}
    """

    TASK:
    Map the data from the CV to the form fields. 
    Return a JSON object with a "mappings" array.
    Each mapping should have: "fieldId", "fieldName", and "value".
    Only return the JSON. No preamble.
  `;

    console.log('[CATA] AI Prompt:', prompt);
    console.log('[CATA] Sending request to Gemini...');

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    console.log('[CATA] Gemini Raw Response:', text);

    // Clean up code blocks if Gemini returns them
    const cleanedText = text.replace(/```json|```/g, '').trim();

    try {
        const parsedResponse = JSON.parse(cleanedText) as AIResponse;
        console.log('[CATA] Parsed AI Mappings:', parsedResponse.mappings);
        return parsedResponse;
    } catch (err) {
        console.error('[CATA] Failed to parse Gemini response:', text);
        throw new Error('AI returned invalid JSON structure.');
    }
}

chrome.runtime.onMessage.addListener((message: MessageAction, sender, sendResponse) => {
    if (message.type === 'PROCESS_AI') {
        callGemini(message.cvText, message.formData)
            .then((response) => {
                sendResponse({ type: 'AI_SUCCESS', mappings: response.mappings });
            })
            .catch((error) => {
                sendResponse({ type: 'AI_ERROR', error: error.message });
            });
        return true; // Keep channel open for async response
    }
});
