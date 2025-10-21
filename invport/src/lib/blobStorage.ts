/**
 * Azure Blob Storage Utilities for Inventory Images
 * 
 * Storage Structure:
 * - https://storageinventoryflatt.blob.core.windows.net/invpics/units/
 *   - /{VIN}/IMG_001.png, IMG_002.png, ...
 */

// Type mapping for folder structure (keeping for backwards compatibility)
export type UnitType = 'FishHouse' | 'Vehicle' | 'Trailer';

/**
 * Get the base URL for images from environment variable or fallback
 */
function getImageBaseUrl(): string {
  // For production, use environment variable
  const envBaseUrl = process.env.NEXT_PUBLIC_IMG_BASE_URL || process.env.IMGBaseURL;
  
  if (envBaseUrl) {
    // Ensure it ends with a slash
    return envBaseUrl.endsWith('/') ? envBaseUrl : `${envBaseUrl}/`;
  }
  
  // Fallback for development
  return 'https://storageinventoryflatt.blob.core.windows.net/invpics/units/';
}

/**
 * Get the folder path based on TypeID (keeping for backwards compatibility)
 */
export function getTypeFolderName(typeId: number): string {
  switch (typeId) {
    case 1:
      return 'fishhouses';
    case 2:
      return 'vehicles'; 
    case 3:
      return 'trailers';
    default:
      return 'vehicles';
  }
}

/**
 * Get the full blob URL for a specific image
 * New format: https://storageinventoryflatt.blob.core.windows.net/invpics/units/{VIN}/IMG_{number}.png
 */
export function getImageUrl(vin: string, typeId: number, imageNumber: number): string {
  const baseUrl = getImageBaseUrl();
  const paddedNumber = imageNumber.toString().padStart(3, '0');
  return `${baseUrl}${vin}/IMG_${paddedNumber}.png`;
}

/**
 * Get all image URLs for a VIN
 * Returns array of image URLs in order (IMG_001.png, IMG_002.png, etc.)
 */
export function getAllImageUrls(vin: string, typeId: number, maxImages: number = 10): string[] {
  const baseUrl = getImageBaseUrl();
  const urls: string[] = [];
  
  for (let i = 1; i <= maxImages; i++) {
    const paddedNumber = i.toString().padStart(3, '0');
    urls.push(`${baseUrl}${vin}/IMG_${paddedNumber}.png`);
  }
  
  return urls;
}

/**
 * Check if an image exists at the given URL
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Load all existing images for a VIN
 * Returns only the URLs that actually exist
 */
export async function loadExistingImages(vin: string, typeId: number, maxCheck: number = 10): Promise<string[]> {
  const baseUrl = getImageBaseUrl();
  const existingImages: string[] = [];
  
  // Check images sequentially (IMG_001, IMG_002, IMG_003, ...) and stop when we hit a missing one
  for (let i = 1; i <= maxCheck; i++) {
    const paddedNumber = i.toString().padStart(3, '0');
    const url = `${baseUrl}${vin}/IMG_${paddedNumber}.png`;
    const exists = await checkImageExists(url);
    
    if (exists) {
      existingImages.push(url);
    } else {
      // If we hit a gap, stop checking (assumes sequential naming)
      break;
    }
  }
  
  return existingImages;
}

/**
 * Get the blob folder path for uploading
 */
export function getBlobFolderPath(vin: string, typeId: number): string {
  const folder = getTypeFolderName(typeId);
  return `${folder}/${vin}`;
}

/**
 * Generate the next image number for upload
 */
export function getNextImageNumber(existingImages: string[]): number {
  return existingImages.length + 1;
}

/**
 * Parse image number from URL
 */
export function getImageNumberFromUrl(url: string): number | null {
  const match = url.match(/\/IMG_(\d+)\.png$/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Build upload URL for Azure Blob Storage
 * Note: This requires SAS token or proper authentication
 */
export function buildUploadUrl(vin: string, typeId: number, imageNumber: number): string {
  const baseUrl = getImageBaseUrl();
  const paddedNumber = imageNumber.toString().padStart(3, '0');
  return `${baseUrl}${vin}/IMG_${paddedNumber}.png`;
}
