import { FormField, MessageAction } from '../types';

/**
 * Finds all input-like elements recursively.
 */
function scrapeFormFields(): FormField[] {
    const fields: FormField[] = [];
    const elements = document.querySelectorAll('input, textarea, select');

    console.log(`[CATA] Found ${elements.length} potential form elements.`);

    elements.forEach((el) => {
        const element = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

        // Skip hidden or irrelevant fields
        if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
            return;
        }

        // Attempt to find a label
        let labelText = '';
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) labelText = label.textContent?.trim() || '';
        }

        if (!labelText) {
            // Look for parent label or sibling
            const parentLabel = element.closest('label');
            if (parentLabel) {
                labelText = parentLabel.textContent?.trim() || '';
            } else {
                // Fallback to name or placeholder
                const placeholder = 'placeholder' in element ? (element as HTMLInputElement | HTMLTextAreaElement).placeholder : '';
                labelText = element.name || placeholder || element.id || 'Field';
            }
        }

        const field = {
            id: element.id || Math.random().toString(36).substr(2, 9),
            name: element.name || '',
            label: labelText,
            type: element.type,
            placeholder: 'placeholder' in element ? (element as HTMLInputElement | HTMLTextAreaElement).placeholder : '',
        };

        console.log(`[CATA] Scraped Field:`, field);
        fields.push(field);
    });

    console.log(`[CATA] Total scraped fields:`, fields);
    return fields;
}

/**
 * Sets value on an element and dispatches events to trigger framework updates.
 */
function setFieldValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
    )?.set;
    const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value'
    )?.set;

    if (element instanceof HTMLInputElement && nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
    } else if (element instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, value);
    } else if (element instanceof HTMLSelectElement && nativeSelectValueSetter) {
        nativeSelectValueSetter.call(element, value);
    } else {
        element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Executes the autofill logic.
 */
function autofill(mappings: { fieldId: string; fieldName: string; value: string }[]) {
    console.log(`[CATA] Starting autofill with ${mappings.length} mappings.`);
    mappings.forEach((mapping) => {
        let element: HTMLElement | null = null;

        if (mapping.fieldId) {
            element = document.getElementById(mapping.fieldId);
        }

        if (!element && mapping.fieldName) {
            element = document.querySelector(`[name="${mapping.fieldName}"]`);
        }

        if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
            console.log(`[CATA] Filling field "${mapping.fieldName || mapping.fieldId}" with value: "${mapping.value}"`);
            setFieldValue(element, mapping.value);
        } else {
            console.warn(`[CATA] Could not find element for mapping:`, mapping);
        }
    });
    console.log(`[CATA] Autofill complete.`);
}

// Message Listener
chrome.runtime.onMessage.addListener((message: MessageAction, sender, sendResponse) => {
    if (message.type === 'SCRAPE_DOM') {
        const fields = scrapeFormFields();
        sendResponse(fields);
    } else if (message.type === 'FILL_FORM') {
        autofill(message.mappings);
        sendResponse({ success: true });
    }
    return true;
});
