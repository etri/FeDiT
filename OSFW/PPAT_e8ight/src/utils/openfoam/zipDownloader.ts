/**
 * ZIP File Generation and Download Utilities
 */
import JSZip from 'jszip';
import type { OpenFOAMCase } from './caseGenerator';

/**
 * Create ZIP file from OpenFOAM case files
 */
export async function createZipFromCase(
  openfoamCase: OpenFOAMCase
): Promise<Blob> {
  const zip = new JSZip();

  console.log('📦 Creating ZIP from case:', {
    totalFiles: openfoamCase.files.length
  });

  // Check for STL file
  const stlFile = openfoamCase.files.find(f => f.path.includes('.stl'));
  console.log('🔍 STL File in case:', {
    found: !!stlFile,
    path: stlFile?.path,
    size: stlFile?.content?.length || 0
  });

  // Add all files to the ZIP
  for (const file of openfoamCase.files) {
    zip.file(file.path, file.content);

    if (file.path.includes('.stl')) {
      console.log('✅ Adding STL to ZIP:', {
        path: file.path,
        contentLength: file.content.length,
        contentPreview: file.content.substring(0, 50)
      });
    }
  }

  // Generate ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });

  console.log('✅ ZIP generated:', {
    size: blob.size,
    type: blob.type
  });

  return blob;
}

/**
 * Download ZIP file to user's computer
 */
export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generate and download OpenFOAM case as ZIP
 */
export async function generateAndDownloadCase(
  openfoamCase: OpenFOAMCase,
  projectName: string,
  simulationType: string
): Promise<void> {
  try {
    // Create ZIP file
    const zipBlob = await createZipFromCase(openfoamCase);

    // Generate filename - OpenFOAM requires alphanumeric only (no special chars)
    // Format: ProjectNameSimulationTypeYYYYMMDDHHMMSS
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // Remove all special characters from project name and simulation type
    const safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');
    const safeType = simulationType.replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${safeName}${safeType}${timestamp}.zip`;

    // Download
    downloadZip(zipBlob, filename);

    console.log(`OpenFOAM case downloaded: ${filename}`);
  } catch (error) {
    console.error('Failed to generate and download case:', error);
    throw error;
  }
}
