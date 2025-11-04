

const STIRLING_API_BASE_PATH = '/api/api/v1';

export const callStirlingApi = async (
  endpoint: string,
  formData: FormData,
  onProgress?: (message: string) => void
): Promise<{ blob: Blob; filename: string }> => {
  const url = `${STIRLING_API_BASE_PATH}${endpoint}`;
  try {
    onProgress?.('Uploading file(s)...');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Check if the error is HTML, which indicates a server/proxy error rather than a specific API error message.
      if (errorText && errorText.trim().toLowerCase().startsWith('<!doctype html')) {
          throw new Error('A server error occurred. The API endpoint could not be reached (404 Not Found). This is likely a deployment configuration issue.');
      }
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
    console.error(`API call to ${url} failed:`, error);
    if (error instanceof Error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the server.');
  }
};