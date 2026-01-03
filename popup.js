// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.js';

const cvInput = document.getElementById('cvInput');
const dropZone = document.getElementById('dropZone');
const uploadText = document.getElementById('uploadText');
const cvInfo = document.getElementById('cvInfo');
const fillBtn = document.getElementById('fillBtn');
const statusDiv = document.getElementById('status');
const loader = document.getElementById('loader');

let cvText = "";

// Handle file selection
dropZone.addEventListener('click', () => cvInput.click());

cvInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
        try {
            updateStatus("Extracting text from CV...");
            cvText = await extractTextFromPDF(file);
            await chrome.storage.local.set({ cvText: cvText });

            uploadText.textContent = file.name;
            cvInfo.style.display = 'block';
            fillBtn.disabled = false;
            updateStatus("CV loaded and parsed.");
        } catch (error) {
            console.error(error);
            updateStatus("Error parsing PDF.");
        }
    }
});

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n";
    }
    return text;
}

fillBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    updateStatus("Scanning form fields...");
    setLoading(true);

    try {
        // 1. Ask content script to extract DOM
        const domInfo = await chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DOM" });

        if (!domInfo || domInfo.fields.length === 0) {
            updateStatus("No form fields found.");
            setLoading(false);
            return;
        }

        updateStatus("AI is mapping fields...");

        // 2. Send to background for Gemini processing
        const response = await chrome.runtime.sendMessage({
            action: "PROCESS_WITH_GEMINI",
            domInfo: domInfo,
            cvText: cvText
        });

        if (response.error) {
            updateStatus("AI Error: " + response.error);
            setLoading(false);
            return;
        }

        updateStatus("Filling form...");

        // 3. Ask content script to autofill
        await chrome.tabs.sendMessage(tab.id, {
            action: "AUTOFILL_FORM",
            mapping: response.mapping
        });

        updateStatus("Form filled successfully!");
    } catch (error) {
        console.error(error);
        updateStatus("An error occurred: " + error.message);
    } finally {
        setLoading(false);
    }
});

function updateStatus(msg) {
    statusDiv.textContent = msg;
}

function setLoading(isLoading) {
    fillBtn.disabled = isLoading;
    loader.style.display = isLoading ? 'block' : 'none';
}
