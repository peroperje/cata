import React from 'react';
import { Zap, Trash2, CheckCircle2, Key, Plus, Save, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { AIModel } from '@cata/shared-types';

interface AutofillSectionProps {
    models: AIModel[];
    selectedModelId: number | null;
    apiKey: string;
    onModelChange: (id: number | null) => void;
    onApiKeyChange: (value: string) => void;
    onSaveApiKey: () => void;
    onFill: (instruction: string, jobApplicationId?: number) => void;
    onFillFromDatabase: (jobApplicationId: number) => void;
    onCheckStoredResult: (jobApplicationId: number) => Promise<boolean>;
    onAddModel: (name: string, provider: string, model_name: string) => void;
    onDeleteModel: (id: number) => void;
    isLoading: boolean;
    renderAutofillButton?: boolean;
}

export const AutofillSection: React.FC<AutofillSectionProps> = ({
    models,
    selectedModelId,
    apiKey,
    onModelChange,
    onApiKeyChange,
    onSaveApiKey,
    onFill,
    onFillFromDatabase,
    onCheckStoredResult,
    onAddModel,
    onDeleteModel,
    isLoading,
    renderAutofillButton = true
}) => {
    const [isAddingMode, setIsAddingMode] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [newProvider, setNewProvider] = React.useState('gemini');
    const [newModelName, setNewModelName] = React.useState('gemini-1.5-flash');
    const [instruction, setInstruction] = React.useState('');
    const [jobApplicationId, setJobApplicationId] = React.useState<string>('');
    const [hasStoredResult, setHasStoredResult] = React.useState(false);
    const [isModelsExpanded, setIsModelsExpanded] = React.useState(false);

    React.useEffect(() => {
        const check = async () => {
            if (jobApplicationId && !isNaN(parseInt(jobApplicationId))) {
                const exists = await onCheckStoredResult(parseInt(jobApplicationId));
                setHasStoredResult(exists);
            } else {
                setHasStoredResult(false);
            }
        };
        check();
    }, [jobApplicationId, onCheckStoredResult]);

    const handleAdd = () => {
        if (newName && newProvider && newModelName) {
            onAddModel(newName, newProvider, newModelName);
            setIsAddingMode(false);
            setNewName('');
        }
    };

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {renderAutofillButton && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>Job Application ID (Optional):</div>
                        <input
                            type="number"
                            placeholder="e.g. 327"
                            value={jobApplicationId}
                            onChange={(e) => setJobApplicationId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: '#e2e8f0'
                            }}
                        />
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginTop: '0.25rem' }}>AI Instructions:</div>
                    <textarea
                        placeholder="Additional instructions for AI (e.g. 'Only fill missed fields')"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '0.5rem',
                            fontSize: '0.8rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            resize: 'vertical'
                        }}
                    />
                    <button
                        className="button"
                        onClick={() => onFill(instruction, jobApplicationId ? parseInt(jobApplicationId) : undefined)}
                        disabled={isLoading || !selectedModelId}
                        style={{ width: '100%' }}
                    >
                        <Zap size={18} fill="currentColor" />
                        Autofill Form
                    </button>

                    <button
                        className="button"
                        onClick={() => jobApplicationId && onFillFromDatabase(parseInt(jobApplicationId))}
                        disabled={isLoading || !hasStoredResult}
                        style={{ 
                            width: '100%',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#10b981'
                        }}
                    >
                        <Database size={18} />
                        Autofill from Database
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div 
                    onClick={() => setIsModelsExpanded(!isModelsExpanded)}
                    style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold', 
                        color: '#6b7280', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        userSelect: 'none'
                    }}
                >
                    {isModelsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Models: {!isModelsExpanded && selectedModelId && (
                        <span style={{ fontWeight: 'normal', color: '#94a3b8', fontSize: '0.75rem' }}>
                             (Selected: {models.find(m => m.id === selectedModelId)?.name})
                        </span>
                    )}
                </div>

                {isModelsExpanded && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {models.map(m => (
                                <div
                                    key={m.id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        backgroundColor: selectedModelId === m.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${selectedModelId === m.id ? '#6366f1' : 'transparent'}`,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}
                                            onClick={() => onModelChange(selectedModelId === m.id ? null : m.id)}
                                        >
                                            <CheckCircle2 size={16} style={{ color: selectedModelId === m.id ? '#6366f1' : '#4b5563' }} />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: selectedModelId === m.id ? '#f8fafc' : '#94a3b8' }}>
                                                    {m.name}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                    {m.provider} / {m.model_name}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {m.has_key && <span title="API Key set"><Key size={14} style={{ color: '#10b981' }} /></span>}
                                            <button
                                                onClick={() => onDeleteModel(m.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#94a3b8',
                                                    cursor: 'pointer',
                                                    padding: '4px'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {selectedModelId === m.id && (
                                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                                            <input
                                                type="password"
                                                placeholder={m.has_key ? "Update API Key" : "Enter API Key"}
                                                value={apiKey}
                                                onChange={(e) => onApiKeyChange(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    fontSize: '0.75rem',
                                                    padding: '4px 8px',
                                                    height: '28px',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                            <button
                                                onClick={onSaveApiKey}
                                                disabled={!apiKey}
                                                className="button"
                                                style={{
                                                    width: 'auto',
                                                    padding: '0 8px',
                                                    height: '28px',
                                                    fontSize: '0.75rem',
                                                    backgroundColor: '#334155'
                                                }}
                                            >
                                                <Save size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!isAddingMode ? (
                            <button
                                onClick={() => setIsAddingMode(true)}
                                style={{
                                    background: 'transparent',
                                    border: '1px dashed rgba(99, 102, 241, 0.4)',
                                    borderRadius: '8px',
                                    color: '#6366f1',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    padding: '0.5rem',
                                    marginTop: '0.25rem'
                                }}
                            >
                                <Plus size={14} /> Add New Model
                            </button>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                border: '1px solid rgba(99, 102, 241, 0.3)'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Display Name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    style={{ 
                                        fontSize: '0.8rem', 
                                        padding: '6px 10px',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: '#f8fafc'
                                    }}
                                />
                                <select
                                    value={newProvider}
                                    onChange={(e) => setNewProvider(e.target.value)}
                                    style={{ 
                                        fontSize: '0.8rem', 
                                        padding: '6px 10px',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: '#f8fafc',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="gemini" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>Gemini</option>
                                    <option value="groq" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>Groq</option>
                                    <option value="huggingface" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>HuggingFace</option>
                                    <option value="openai" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>OpenAI</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Model Name (e.g. gemini-1.5-flash)"
                                    value={newModelName}
                                    onChange={(e) => setNewModelName(e.target.value)}
                                    style={{ 
                                        fontSize: '0.8rem', 
                                        padding: '6px 10px',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: '#f8fafc'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <button
                                        onClick={() => setIsAddingMode(false)}
                                        className="button"
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'transparent',
                                            border: '1px solid #334155',
                                            padding: '6px 10px',
                                            fontSize: '0.75rem',
                                            color: '#94a3b8'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        className="button"
                                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
                                    >
                                        Add Model
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
