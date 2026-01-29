import React, { useState } from 'react';
import { StatusBanner } from './components/StatusBanner';
import { CvSection, AutofillSection, ApplicationCard, ConfirmModal } from '@cata/shared-ui';
import { CollapsibleSection } from './components/CollapsibleSection';
import { ScraperSection } from './components/ScraperSection';
import { JobsApplyTracker } from './components/JobsApplyTracker';
import { useCvs } from './hooks/useCvs';
import { useModels } from './hooks/useModels';
import { useScraper } from './hooks/useScraper';
import { useAutofill } from './hooks/useAutofill';
import { useJobTracker } from './hooks/useJobTracker';

const App: React.FC = () => {
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: '',
    });

    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        cv: true,
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
        toggleFavorite
    } = useScraper(setStatus, expandedSections.scraper);

    const { handleFill } = useAutofill(pdfText, selectedModelId, setStatus);

    const {
        applications,
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
            </header>

            <StatusBanner status={status} />

            <CollapsibleSection
                title="Manage CV"
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
                title="Autofill Page"
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
                    onToggleFavorite={toggleFavorite}
                    isLoading={status.type === 'loading'}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Jobs Apply Tracker"
                isExpanded={expandedSections.jat}
                onToggle={() => toggleSection('jat')}
            >
                <JobsApplyTracker
                    applications={applications}
                    currentJob={currentJob}
                    isExtracting={isExtracting}
                    isSaving={isSaving}
                    onAdd={addApplication}
                    onUpdateStatus={updateStatus}
                    onUpdateNotes={updateNotes}
                    onDelete={deleteApplication}
                    onRefresh={refreshMetadata}
                />
            </CollapsibleSection>
        </div >
    );
};

export default App;
