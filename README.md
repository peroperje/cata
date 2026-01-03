# AI Job Auto-Filler Chrome Extension

A modern Chrome Extension (Manifest V3) built with Vite, TypeScript, and React that uses Gemini AI to automatically fill job application forms using data extracted from your PDF CV.

## Features

- **Local PDF Parsing**: Extracts text from your CV locally in the browser using `pdfjs-dist`.
- **AI-Powered Mapping**: Uses Google Gemini Pro (via API) to intelligently map CV content to web form fields.
- **Framework Bypassing**: Uses a specialized "Value Setter" to ensure form values are recognized by React/Angular/Vue-based sites.
- **Premium UI**: Sleek, modern interface built with React and Lucide icons.

## Tech Stack

- **Core**: Vite + TypeScript + @crxjs/vite-plugin
- **UI**: React + Lucide React
- **PDF Logic**: PDF.js
- **AI**: Google Generative AI (Gemini)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Extension**:
   ```bash
   npm run build
   ```

3. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder.

## Usage

1. **API Key**: Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/) and enter it in the extension popup.
2. **Upload CV**: Upload your CV in PDF format. The text will be extracted and stored locally.
3. **Auto-Fill**: Navigate to a job application page and click "Auto-Fill Page".
