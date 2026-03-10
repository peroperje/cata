import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker. Since we are in a Vite environment, 
// we can use the bundled worker path.
// @ts-expect-error - Vite specific worker import syntax
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: unknown) => (item as { str: string }).str)
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}
