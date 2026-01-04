export interface FormField {
    id: string;
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string[]; // For select elements
}

export interface CVData {
    text: string;
    fileName: string;
}

export interface AIResponse {
    mappings: {
        fieldId: string;
        fieldName: string;
        value: string;
        rationale?: string;
    }[];
}

export interface AIModel {
    id: number;
    name: string;
    provider: string;
    model_name: string;
}

export type MessageAction =
    | { type: 'SCRAPE_DOM' }
    | { type: 'FILL_FORM', mappings: AIResponse['mappings'] }
    | { type: 'PROCESS_AI', cvText: string, formData: FormField[], modelId: number }
    | { type: 'AI_SUCCESS', mappings: AIResponse['mappings'] }
    | { type: 'AI_ERROR', error: string };
