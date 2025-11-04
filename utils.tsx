
export const STIRLING_API_PREFIX = '/api/v1/general';

export const callStirlingApi = async (
  endpoint: string,
  formData: FormData,
  onProgress?: (message: string) => void
): Promise<{ blob: Blob; filename: string }> => {
  try {
    onProgress?.('Uploading file(s)...');
    const response = await fetch(`${STIRLING_API_PREFIX}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `API request failed: ${response.statusText} (${response.status})`);
    }

    onProgress?.('Processing file on server...');
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    onProgress?.('Download ready!');
    return { blob, filename };

  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    if (error instanceof Error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the server.');
  }
};
