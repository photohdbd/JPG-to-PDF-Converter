/**
 * A utility function that now clearly indicates that server-side operations are not implemented.
 * This replaces the previous mock that returned a dummy file, which was misleading.
 * @param endpoint The API endpoint that would have been called.
 * @param formData The FormData object containing files and options.
 * @param onProgress An optional callback to report progress updates.
 * @returns A promise that rejects, indicating the feature is not available.
 */
export const callStirlingApi = async (
  endpoint: string,
  formData: FormData,
  onProgress?: (message: string) => void
): Promise<{ blob: Blob; filename: string }> => {
  
  onProgress?.('Initializing process...');

  // Simulate a brief processing period to maintain UI feedback consistency.
  await new Promise(resolve => setTimeout(resolve, 1000));
  onProgress?.('Validating inputs...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Throw a clear, user-friendly error for all server-side operations.
  throw new Error("This feature requires a server-side component which is not implemented in this demonstration. Only client-side tools like Image-to-PDF and PDF-to-Image are functional.");
};
