// Enable side panel click behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// The background script now just listens for messages if needed,
// but the AI logic has moved to the API server called directly from the popup.
// We keep it as a placeholder or for other background tasks.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Current AI logic moved to API.
    // If you still want to route through background to avoid CORS in some environments:
    /*
    if (message.type === 'PROCESS_AI') {
        fetch('http://localhost:8000/api/v1/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cvText: message.cvText,
                formData: message.formData,
                modelId: message.modelId
            })
        })
        .then(res => res.json())
        .then(response => {
            sendResponse({ type: 'AI_SUCCESS', mappings: response.mappings });
        })
        .catch(error => {
            sendResponse({ type: 'AI_ERROR', error: error.message });
        });
        return true;
    }
    */
});
