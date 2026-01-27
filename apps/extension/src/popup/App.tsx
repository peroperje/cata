import React, { useState } from 'react';
import { StatusBanner } from './components/StatusBanner';
import { CollapsibleSection } from './components/CollapsibleSection';
import { CvSection } from './components/CvSection';
import { AutofillSection } from './components/AutofillSection';
import { ScraperSection } from './components/ScraperSection';
import { useCvs } from './hooks/useCvs';
import { useModels } from './hooks/useModels';
import { useScraper } from './hooks/useScraper';
import { useAutofill } from './hooks/useAutofill';

const App: React.FC = () => {
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: '',
    });

    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        cv: true,
        autofill: false,
        scraper: false
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
        handleFileUpload
    } = useCvs(setStatus);

    const {
        models,
        selectedModelId,
        apiKey,
        setApiKey,
        saveApiKey,
        handleModelChange
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
                    fileName={fileName}
                    cvs={cvs}
                    selectedCvId={selectedCvId}
                    onFileUpload={handleFileUpload}
                    onCvSelect={handleCvSelect}
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
        </div >
    );
};

export default App;
