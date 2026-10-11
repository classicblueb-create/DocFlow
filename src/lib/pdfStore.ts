/**
 * pdfStore.ts
 * Centralized PDF blob store — compatible with DocFlowView's existing localStorage keys.
 * Each PDF is stored under `df_pdf_{docId}` as a base64 data URL.
 */

const PDF_BLOB_PREFIX = 'df_pdf_';
const MAX_PDF_BYTES = 1_048_576; // 1 MB

/**
 * Store a PDF blob (as data URL) for a document ID.
 * @returns true if stored successfully, false if too large
 */
export function savePdfBlob(docId: string, dataUrl: string): boolean {
  const approxBytes = Math.floor(dataUrl.length * 0.75);
  if (approxBytes > MAX_PDF_BYTES) return false;
  try {
    localStorage.setItem(`${PDF_BLOB_PREFIX}${docId}`, dataUrl);
    return true;
  } catch { return false; }
}

/**
 * Retrieve a PDF blob (as data URL) for a document ID.
 * @returns The data URL string or null if not found
 */
export function getPdfBlob(docId: string): string | null {
  try {
    return localStorage.getItem(`${PDF_BLOB_PREFIX}${docId}`);
  } catch { return null; }
}

/**
 * Delete a stored PDF blob.
 */
export function deletePdfBlob(docId: string): void {
  try {
    localStorage.removeItem(`${PDF_BLOB_PREFIX}${docId}`);
  } catch { /* ignore */ }
}

/**
 * Get all stored document IDs that have PDFs.
 */
export function getAllPdfIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PDF_BLOB_PREFIX)) {
        ids.push(key.slice(PDF_BLOB_PREFIX.length));
      }
    }
  } catch { /* ignore */ }
  return ids;
}

/**
 * Clear all stored PDFs.
 */
export function clearAllPdfs(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PDF_BLOB_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
