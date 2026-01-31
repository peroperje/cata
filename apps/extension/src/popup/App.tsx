import React, { useState } from 'react';
import { StatusBanner } from './components/StatusBanner';
import { CvSection, AutofillSection } from '@cata/shared-ui';
import { CollapsibleSection } from './components/CollapsibleSection';
import { ScraperSection } from './components/ScraperSection';
import { JobsApplyTracker } from './components/JobsApplyTracker';
import { useCvs } from './hooks/useCvs';
import { useModels } from './hooks/useModels';
import { useScraper } from './hooks/useScraper';
import { useAutofill } from './hooks/useAutofill';
import { APP_VERSION } from '@cata/shared-types';
import { useJobTracker } from './hooks/useJobTracker';

const App: React.FC = () => {
    const [status, setStatus] = useState<{ 
        type: 'idle' | 'loading' | 'success' | 'error'; 
        message: string;
        errorType?: string;
    }>({
        type: 'idle',
        message: '',
    });

    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        cv: false,
        autofill: false,
        scraper: false,
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
        fileName,
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

    const {
        scraperUrl,
        setScraperUrl,
        isScraping,
        jobCount,
        scrapedJobs,
        handleStartScraping,
        handleStopScraping,
        toggleIrrelevant,
        toggleUsed,
        linkApplication,
        unlinkApplication,
        searchApplications
    } = useScraper(setStatus, expandedSections.scraper);

    const { handleFill } = useAutofill(pdfText, selectedModelId, setStatus);

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
                    onAddModel={addModel}
                    onDeleteModel={deleteModel}
                    isLoading={status.type === 'loading'}
                    renderAutofillButton={true}
                />
            </CollapsibleSection>
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
                    onRefresh={refreshMetadata}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Scraper"
                isExpanded={expandedSections.scraper}
                onToggle={() => toggleSection('scraper')}
            >
                <ScraperSection
                    isScraping={isScraping}
                    scraperUrl={scraperUrl}
                    jobCount={jobCount}
                    scrapedJobs={scrapedJobs}
                    onUrlChange={setScraperUrl}
                    onStartScraping={handleStartScraping}
                    onStopScraping={handleStopScraping}
                    onToggleIrrelevant={toggleIrrelevant}
                    onToggleUsed={toggleUsed}
                    onLinkApplication={linkApplication}
                    onUnlinkApplication={unlinkApplication}
                    onSearchApplications={searchApplications}
                    isLoading={status.type === 'loading'}
                />
            </CollapsibleSection>


        </div >
    );
};

export default App;
