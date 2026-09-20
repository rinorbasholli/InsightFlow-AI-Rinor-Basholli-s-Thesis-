/**
 * Triggers a robust binary download of the academic Word document (.docx)
 * Handles iframe sandbox constraints, blob conversion, and fallbacks.
 */
export async function downloadReportDocx(
  onProgress?: (loading: boolean, error?: string) => void
): Promise<void> {
  if (onProgress) onProgress(true);

  try {
    const response = await fetch('/api/export-report-docx', {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const blob = await response.blob();
    const docxBlob = new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const url = window.URL.createObjectURL(docxBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AI_Cybersecurity_Risk_Lab_Academic_Report.docx');
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 1500);

    if (onProgress) onProgress(false);
  } catch (error: any) {
    console.warn('Blob download failed, falling back to direct navigation:', error);
    if (onProgress) onProgress(false, error?.message);
    // Direct link fallback
    window.location.href = '/api/export-report-docx';
  }
}
