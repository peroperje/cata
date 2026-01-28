import { FormField, MessageAction } from '../types';

/**
 * Finds all input-like elements recursively, including those in Shadow DOM and same-origin IFrames.
 */
function scrapeFormFields(root: Document | ShadowRoot | Element = document): FormField[] {
    const fields: FormField[] = [];

    function collect(node: Document | ShadowRoot | Element) {
        // Broad query for potential form elements
        const elements = node.querySelectorAll('input, textarea, select, [contenteditable="true"], [role="textbox"]');

        elements.forEach((el) => {
            try {
                const element = el as HTMLElement;
                const type = (element as any).type || element.getAttribute('type') || '';
                const role = element.getAttribute('role') || '';

                // Filtering: Skip buttons, hidden fields, and specific types we can't fill
                const skipTypes = ['hidden', 'submit', 'button', 'file', 'image', 'reset'];
                if (skipTypes.includes(type.toLowerCase())) return;
                if (element.tagName === 'BUTTON' || role === 'button') return;

                // Assign a temporary unique ID for tracking if not already present
                let cataId = element.getAttribute('data-cata-id');
                if (!cataId) {
                    cataId = element.id || `cata-f-${Math.random().toString(36).substr(2, 9)}`;
                    element.setAttribute('data-cata-id', cataId);
                }

                // Label Detection Logic
                let labelText = '';

                // 1. Aria-label
                labelText = element.getAttribute('aria-label') || '';

                // 2. Aria-labelledby
                if (!labelText) {
                    const labelledBy = element.getAttribute('aria-labelledby');
                    if (labelledBy) {
                        const labelEl = document.getElementById(labelledBy);
                        if (labelEl) labelText = labelEl.textContent?.trim() || '';
                    }
                }

                // 3. Native Label (for attribute)
                if (!labelText && element.id) {
                    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
                    if (label) labelText = label.textContent?.trim() || '';
                }

                // 4. Parent Label (wrapping label)
                if (!labelText) {
                    const parentLabel = element.closest('label');
                    if (parentLabel) labelText = parentLabel.textContent?.trim() || '';
                }

                // 5. Title/Placeholder
                if (!labelText) {
                    labelText = (element as any).placeholder || element.getAttribute('placeholder') || element.title || '';
                }

                // 6. Nearby Text
                if (!labelText) {
                    const prev = element.previousElementSibling;
                    if (prev && (prev.tagName === 'SPAN' || prev.tagName === 'LABEL' || prev.tagName === 'DIV')) {
                        labelText = prev.textContent?.trim() || '';
                    }
                }

                // 7. Fallback to Name/ID
                if (!labelText) {
                    labelText = (element as any).name || element.getAttribute('name') || element.id || `Field ${fields.length + 1}`;
                }

                fields.push({
                    id: cataId,
                    name: (element as any).name || element.getAttribute('name') || '',
                    label: labelText.replace(/[*:]/g, '').trim().substring(0, 200),
                    type: type || role || element.tagName.toLowerCase(),
                    placeholder: (element as any).placeholder || element.getAttribute('placeholder') || '',
                });
            } catch (err) {
                console.warn('[CATA] Error scraping element:', el, err);
            }
        });

        // Search in Shadow DOM
        const roots = node.querySelectorAll('*');
        roots.forEach((el) => {
            if (el.shadowRoot) collect(el.shadowRoot);
        });

        // Search in Same-Origin IFrames
        if (node === document) {
            document.querySelectorAll('iframe').forEach((iframe) => {
                try {
                    if (iframe.contentDocument) collect(iframe.contentDocument);
                } catch (e) { }
            });
        }
    }

    collect(root);
    console.log(`[CATA] Total scraped fields: ${fields.length}`);
    return fields;
}

/**
 * Sets value on an element and dispatches events to trigger framework updates.
 * Handles Custom Elements (Web Components) by searching shadow roots.
 */
function setFieldValue(element: HTMLElement, value: string) {
    if (!element || value === undefined || value === null) return;

    console.log(`[CATA] Filling ${element.tagName} (${element.id || (element as any).name || 'unnamed'}) with: "${value}"`);

    // Helper to find the "real" input element if this is a custom element wrapper
    const getRealInput = (el: HTMLElement): HTMLElement | null => {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return el;
        if (el.isContentEditable) return el;

        // Check shadow root for an input
        if (el.shadowRoot) {
            const inner = el.shadowRoot.querySelector('input, textarea, select, [contenteditable="true"]');
            if (inner) return inner as HTMLElement;
        }

        // Check if it's a known custom wrapper prefix or has a value property
        if ('value' in el || el.tagName.includes('-')) {
            const inner = el.querySelector('input, textarea, select');
            if (inner) return inner as HTMLElement;
        }

        return null;
    };

    const target = getRealInput(element) || element;

    // 1. Handle Checkboxes and Radios
    if (target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio')) {
        const shouldBeChecked = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on' || value.toLowerCase() === 'yes';
        if (target.checked !== shouldBeChecked) {
            target.focus();
            target.click();
            target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            target.blur();
        }
        return;
    }

    // 2. Handle ContentEditable
    if (target.isContentEditable) {
        target.focus();
        target.innerText = value;
        target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        target.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
        return;
    }

    // 3. Handle Selects
    if (target instanceof HTMLSelectElement) {
        target.focus();
        target.value = value;
        target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        target.blur();
        return;
    }

    // 4. Default Input Handling (including custom elements that expose a .value)
    target.focus();

    // Bypass modern framework trackers
    const prototype = Object.getPrototypeOf(target);
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (valueSetter) {
        valueSetter.call(target, value);
    } else {
        (target as any).value = value;
    }

    // Dispatch a comprehensive sequence of events
    const eventOptions = { bubbles: true, composed: true };
    target.dispatchEvent(new InputEvent('beforeinput', { ...eventOptions, data: value, inputType: 'insertText' }));
    target.dispatchEvent(new Event('input', eventOptions));
    target.dispatchEvent(new Event('change', eventOptions));

    // Support for React value tracking
    const tracker = (target as any)._valueTracker;
    if (tracker) tracker.setValue(value);

    target.dispatchEvent(new Event('blur', eventOptions));

    // Force sync for Custom Elements (some need the host element notified)
    if (target !== element) {
        if ('value' in element) (element as any).value = value;
        element.dispatchEvent(new Event('input', eventOptions));
        element.dispatchEvent(new Event('change', eventOptions));
    }
}

/**
 * Finds an element by mapping across all potential roots (Shadow DOM, IFrames)
 */
function findElement(mapping: { fieldId: string; fieldName: string }, root: Document | ShadowRoot | Element = document): HTMLElement | null {
    // 1. Try by data-cata-id
    let element = root.querySelector(`[data-cata-id="${mapping.fieldId}"]`) as HTMLElement;
    if (element) return element;

    // 2. Try by ID
    if (mapping.fieldId && !mapping.fieldId.startsWith('cata-f-')) {
        try {
            element = root.querySelector(`#${CSS.escape(mapping.fieldId)}`) as HTMLElement;
            if (element) return element;
        } catch (e) { }
    }

    // 3. Try by name
    if (mapping.fieldName) {
        try {
            element = root.querySelector(`[name="${CSS.escape(mapping.fieldName)}"]`) as HTMLElement;
            if (element) return element;
        } catch (e) { }
    }

    // Recursive search in Shadow DOM
    const all = root.querySelectorAll('*');
    for (const el of Array.from(all)) {
        if (el.shadowRoot) {
            const found = findElement(mapping, el.shadowRoot);
            if (found) return found;
        }
    }

    // Search in Same-Origin IFrames
    if (root === document) {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of Array.from(iframes)) {
            try {
                if (iframe.contentDocument) {
                    const found = findElement(mapping, iframe.contentDocument);
                    if (found) return found;
                }
            } catch (e) { }
        }
    }

    return null;
}

/**
 * Executes the autofill logic.
 */
function autofill(mappings: { fieldId: string; fieldName: string; value: string }[]) {
    console.log(`[CATA] Starting autofill with ${mappings.length} mappings.`);
    mappings.forEach((mapping) => {
        const element = findElement(mapping);
        if (element) {
            setFieldValue(element, mapping.value);
        } else {
            console.warn(`[CATA] Could not find element for mapping:`, mapping);
        }
    });
    console.log(`[CATA] Autofill complete.`);
}

/**
 * Extracts job title, company, and URL from the current page.
 */
function getJobMetadata() {
    const url = window.location.href;
    let title = '';
    let company = '';

    // LinkedIn Specific
    if (url.includes('linkedin.com/jobs/view') || url.includes('linkedin.com/jobs/search')) {
        title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
            document.querySelector('.t-24.t-bold')?.textContent?.trim() || '';

        company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
            document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim() || '';
    }

    // Glassdoor Specific
    else if (url.includes('glassdoor.com')) {
        title = document.querySelector('[data-test="jobTitle"]')?.textContent?.trim() ||
            document.querySelector('.job-title')?.textContent?.trim() || '';

        company = document.querySelector('[data-test="employerName"]')?.textContent?.trim() ||
            document.querySelector('.employer-name')?.textContent?.trim() || '';
    }

    // Generic fallback (OpenGraph)
    if (!title) {
        title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title;
    }

    return { title, company, url, pageText: document.body.innerText };
}

// Message Listener
chrome.runtime.onMessage.addListener((message: MessageAction, sender, sendResponse) => {
    if (message.type === 'SCRAPE_DOM') {
        try {
            const fields = scrapeFormFields();
            sendResponse(fields);
        } catch (err) {
            console.error('[CATA] Scrape error:', err);
            sendResponse([]);
        }
    } else if (message.type === 'FILL_FORM') {
        try {
            autofill(message.mappings);
            sendResponse({ success: true });
        } catch (err) {
            console.error('[CATA] Fill error:', err);
            sendResponse({ success: false, error: String(err) });
        }
    } else if (message.type === 'GET_JOB_METADATA') {
        try {
            const metadata = getJobMetadata();
            sendResponse(metadata);
        } catch (err) {
            console.error('[CATA] Metadata error:', err);
            sendResponse({ title: '', company: '', url: window.location.href });
        }
    }
    return true;
});
