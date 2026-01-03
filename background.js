chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "PROCESS_WITH_GEMINI") {
        processWithGemini(request.domInfo, request.cvText)
            .then(mapping => sendResponse({ mapping }))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep channel open for async response
    }
});

async function processWithGemini(domInfo, cvText) {
    const { geminiApiKey } = await chrome.storage.local.get("geminiApiKey");

    if (!geminiApiKey) {
        throw new Error("Gemini API Key missing. Please set it in options.");
    }

    const prompt = `
    You are an expert at mapping CV/Resume data to web form fields.
    
    RESUME TEXT:
    ${cvText}
    
    FORM FIELDS JSON:
    ${JSON.stringify(domInfo.fields)}
    
    TASK:
    Analyze the resume text and provide the most accurate values for each form field.
    Return a VALID JSON array of objects where each object has:
    - "index": The index of the field from the FORM FIELDS JSON.
    - "value": The extracted value from the resume.
    
    Strictly return ONLY the JSON array. Match fields like 'First Name', 'Experience', 'Phone', 'Skills', etc.
  `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Gemini API request failed.");
    }

    const data = await response.json();
    const rawResponse = data.candidates[0].content.parts[0].text;

    try {
        return JSON.parse(rawResponse);
    } catch (e) {
        console.error("Failed to parse AI response:", rawResponse);
        throw new Error("AI returned invalid JSON.");
    }
}
