import React, { useState } from 'react';
import { StatusBanner } from './components/StatusBanner';
import { CvSection, AutofillSection } from '@cata/shared-ui';
import { CollapsibleSection } from './components/CollapsibleSection';
import { JobsApplyTracker } from './components/JobsApplyTracker';
import { useCvs } from './hooks/useCvs';
import { useModels } from './hooks/useModels';
import { useAutofill } from './hooks/useAutofill';
import { APP_VERSION, AppStatus } from '@cata/shared-types';
import { useJobTracker } from './hooks/useJobTracker';

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>({
        type: 'idle',
        message: '',
    });

    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        cv: false,
        autofill: false,
        jat: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Hooks
    const {
        cvs,
        selectedCvId,
        pdfText,
        handleCvSelect,
        handleFileUpload,
        deleteCv
    } = useCvs(setStatus);

    const {
        models,
        selectedModelId,
        apiKey,
        setApiKey,
        saveApiKey,
        handleModelChange,
        addModel,
        deleteModel
    } = useModels(setStatus);

    const { handleFill, handleFillFromDatabase, checkStoredResult } = useAutofill(pdfText, selectedModelId, setStatus);

    const {
        applications,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        currentJob,
        isExtracting,
        isSaving,
        addApplication,
        updateStatus,
        updateNotes,
        deleteApplication,
        getEvaluationPrompt,
        refreshMetadata
    } = useJobTracker(setStatus, expandedSections.jat, selectedModelId);

    return (
        <div className="container">
            <header>
                <h1>CATA - AI Job Suite</h1>
                <p className="version">v{APP_VERSION}</p>
            </header>

            <StatusBanner status={status} />

            <CollapsibleSection
                title={`Jobs Apply Tracker ${isExtracting ? '- (Extracting)' : ''} ${isSaving ? '- (Saving)' : ''}`}
                isExpanded={expandedSections.jat}
                onToggle={() => toggleSection('jat')}
            >
                <JobsApplyTracker
                    applications={applications}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterStatus={filterStatus}
                    onStatusFilterChange={setFilterStatus}
                    currentJob={currentJob}
                    isExtracting={isExtracting}
                    isSaving={isSaving}
                    status={status}
                    onAdd={addApplication}
                    onUpdateStatus={updateStatus}
                    onUpdateNotes={updateNotes}
                    onDelete={deleteApplication}
                    onGetPrompt={getEvaluationPrompt}
                    onRefresh={refreshMetadata}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title={`Autofill Page ${!selectedModelId ? '- (No model selected)' : ((selectedModelId, models) => {
                    const model = models.find((m) => m.id === selectedModelId);
                    return model ? ` with ${model.name}` : '';
                })(selectedModelId, models)}`}
                isExpanded={expandedSections.autofill}
                onToggle={() => toggleSection('autofill')}
            >
                <AutofillSection
                    models={models}
                    selectedModelId={selectedModelId}
                    apiKey={apiKey}
                    onModelChange={handleModelChange}
                    onApiKeyChange={setApiKey}
                    onSaveApiKey={saveApiKey}
                    onFill={handleFill}
                    onFillFromDatabase={handleFillFromDatabase}
                    onCheckStoredResult={checkStoredResult}
                    onAddModel={addModel}
                    onDeleteModel={deleteModel}
                    isLoading={status.type === 'loading'}
                    renderAutofillButton={true}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title={` Manage CV ${!selectedCvId ? '- (No CV selected)' : ''}`}
                isExpanded={expandedSections.cv}
                onToggle={() => toggleSection('cv')}
            >
                <CvSection
                    cvs={cvs}
                    selectedCvId={selectedCvId}
                    onFileUpload={handleFileUpload}
                    onCvSelect={handleCvSelect}
                    onDeleteCv={deleteCv}
                />
            </CollapsibleSection>
        </div >
    );
};

export default App;
