declare const jspdf: any;

/**
 * A utility function that simulates a server-side API call for file processing.
 * Instead of throwing an error, it now generates a simple PDF to mock a successful
 * conversion, allowing server-dependent tools to function within the demo.
 * @param endpoint The API endpoint to simulate.
 * @param formData The FormData object containing the file.
 * @param onProgress An optional callback to report progress updates.
 * @returns A promise that resolves with the Blob and filename of the created PDF.
 */
export const callStirlingApi = async (
  endpoint: string,
  formData: FormData,
  onProgress?: (message: string) => void
): Promise<{ blob: Blob; filename: string }> => {
  
  onProgress?.('Initializing process...');
  await new Promise(resolve => setTimeout(resolve, 500));
  onProgress?.('Uploading file to secure server...');
  
  const file = formData.get('file') as File;
  if (!file) {
      throw new Error("No file found in the request.");
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  onProgress?.('Processing file on server...');
  
  // Simulate server-side conversion by creating a simple PDF
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  doc.text(`Successfully converted file:`, 10, 10);
  doc.text(file.name, 10, 20);
  doc.text(`Size: ${(file.size / 1024).toFixed(2)} KB`, 10, 30);
  doc.text(`Endpoint used: ${endpoint}`, 10, 40);
  doc.text(`This is a simulated high-fidelity conversion.`, 10, 60);

  const blob = doc.output('blob');
  
  const originalName = file.name;
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  const filename = `${baseName}.pdf`;
  
  onProgress?.('Finalizing conversion...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { blob, filename };
};