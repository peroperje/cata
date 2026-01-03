chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_DOM") {
        const fields = extractFormFields();
        sendResponse({ fields });
    } else if (request.action === "AUTOFILL_FORM") {
        autofillForm(request.mapping);
        sendResponse({ success: true });
    }
});

function extractFormFields() {
    const elements = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select');
    const extracted = [];

    elements.forEach((el, index) => {
        // Basic properties
        const info = {
            index: index,
            id: el.id || "",
            name: el.name || "",
            type: el.type || el.tagName.toLowerCase(),
            placeholder: el.placeholder || "",
            label: findLabel(el)
        };

        // Add unique selector for identifying it back
        el.setAttribute('data-cata-index', index);
        extracted.push(info);
    });

    return extracted;
}

function findLabel(el) {
    // 1. Check for label with 'for' attribute
    if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) return label.innerText.trim();
    }

    // 2. Check for parent label
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.innerText.trim();

    // 3. Check for aria-label
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');

    // 4. Check for preceding text or siblings (basic attempt)
    const prev = el.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return prev.innerText.trim();

    return "";
}

function autofillForm(mapping) {
    mapping.forEach(item => {
        const el = document.querySelector(`[data-cata-index="${item.index}"]`);
        if (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                if (typeof item.value === 'boolean') {
                    el.checked = item.value;
                } else if (item.value === 'true' || item.value === el.value) {
                    el.checked = true;
                }
            } else {
                el.value = item.value;
            }

            // Trigger events for React/Angular compatibility
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
        }
    });
}
