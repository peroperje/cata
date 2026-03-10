// Enable side panel click behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// The background script now just listens for messages if needed,
// but the AI logic has moved to the API server called directly from the popup.
// We keep it as a placeholder or for other background tasks.

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     // Background tasks can be added here in the future.
// });
