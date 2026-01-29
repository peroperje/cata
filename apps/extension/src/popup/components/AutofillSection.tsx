import React from 'react';
import { Zap } from 'lucide-react';
import { AIModel } from '@cata/shared-types';

interface AutofillSectionProps {
    models: AIModel[];
    selectedModelId: number | null;
    apiKey: string;
    onModelChange: (id: number) => void;
    onApiKeyChange: (value: string) => void;
    onSaveApiKey: () => void;
    onFill: () => void;
    isLoading: boolean;
}

export const AutofillSection: React.FC<AutofillSectionProps> = ({
    models,
    selectedModelId,
    apiKey,
    onModelChange,
    onApiKeyChange,
    onSaveApiKey,
    onFill,
    isLoading
}) => {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <select
                    value={selectedModelId || ''}
                    onChange={(e) => onModelChange(Number(e.target.value))}
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
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button onClick={onSaveApiKey} className="button" style={{ width: 'auto' }}>
                        Save
                    </button>
                </div>
            </section>

            <button className="button" onClick={onFill} disabled={isLoading}>
                <Zap size={18} fill="currentColor" />
                Fill Form
            </button>
        </div>
    );
};
