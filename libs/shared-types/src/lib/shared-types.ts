export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  value?: string;
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
  has_key?: boolean;
}

export interface CV {
  id: number;
  filename: string;
  text: string;
  created_at: string;
}

export interface ScrapedJob {
  id: number;
  title: string;
  url: string;
  content: string;
  similarity_score: number;
  created_at: string;
  is_irrelevant?: boolean;
  is_used?: boolean;
}

export interface JobApplication {
  id: number;
  title: string;
  url: string;
  company: string;
  status: string;
  notes?: string;
  is_favorite: boolean;
  is_irrelevant: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageAction =
  | { type: 'SCRAPE_DOM' }
  | { type: 'FILL_FORM', mappings: AIResponse['mappings'] }
  | { type: 'PROCESS_AI', cvText: string, formData: FormField[], modelId: number }
  | { type: 'AI_SUCCESS', mappings: AIResponse['mappings'] }
  | { type: 'AI_ERROR', error: string }
  | { type: 'GET_JOB_METADATA' };

export type MetadataResponse = {
  title: string;
  company: string;
  url: string;
  pageText?: string;
};
