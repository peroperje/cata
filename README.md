# CATA - AI Job Talent Assistant

A Chrome Extension for automating job applications using Gemini AI.

## Installation Instructions

1.  **Download pdf.js**:
    -   Go to the [pdf.js GitHub releases](https://github.com/mozilla/pdf.js/releases) or the [official website](https://mozilla.github.io/pdf.js/getting_started/#download).
    -   Download the prebuilt version.
    -   Extract the files and copy `pdf.js` and `pdf.worker.js` from the `build` folder into the `lib/` directory of this extension.

2.  **Add Icons**:
    -   Place three PNG icons (16x16, 48x48, 128x128) in the `icons/` folder named `icon16.png`, `icon48.png`, and `icon128.png`.

3.  **Load the Extension**:
    -   Open Chrome and go to `chrome://extensions/`.
    -   Enable "Developer mode" (top right toggle).
    -   Click "Load unpacked" and select this project folder.

4.  **Set up Gemini API Key**:
    -   Right-click the extension icon and select "Options".
    -   Enter your Google Gemini API Key and click "Save".

## Folder Structure

```
cata-chrome-extension/
├── manifest.json
├── popup.html
├── popup.js
├── options.html
├── options.js
├── content.js
├── background.js
├── lib/
│   ├── pdf.js (Download separately)
│   └── pdf.worker.js (Download separately)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## How to Use

1.  Navigate to a job application page (e.g., Greenhouse, Lever, LinkedIn Easy Apply).
2.  Click the extension icon in the toolbar.
3.  Upload your resume (PDF).
4.  Click "Start Filling Form".
5.  Wait for the AI to process and watch the form being filled!
