/**
 * Azure Blob Storage Utilities for Inventory Images
 * 
 * Storage Structure:
 * - https://flattstorage.blob.core.windows.net/invpics/
 *   - /fishhouses/{VIN}/1.png, 2.png, ...
 *   - /vehicles/{VIN}/1.png, 2.png, ...
 *   - /trailers/{VIN}/1.png, 2.png, ...
 */

// Type mapping for folder structure
export type UnitType = 'FishHouse' | 'Vehicle' | 'Trailer';

const BLOB_BASE_URL = 'https://flattstorage.blob.core.windows.net/invpics';

/**
 * Get the folder path based on TypeID
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
 */
export function getImageUrl(vin: string, typeId: number, imageNumber: number): string {
  const folder = getTypeFolderName(typeId);
  return `${BLOB_BASE_URL}/${folder}/${vin}/${imageNumber}.png`;
}

/**
 * Get all image URLs for a VIN
 * Returns array of image URLs in order (1.png, 2.png, etc.)
 */
export function getAllImageUrls(vin: string, typeId: number, maxImages: number = 10): string[] {
  const folder = getTypeFolderName(typeId);
  const urls: string[] = [];
  
  for (let i = 1; i <= maxImages; i++) {
    urls.push(`${BLOB_BASE_URL}/${folder}/${vin}/${i}.png`);
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
  const folder = getTypeFolderName(typeId);
  const existingImages: string[] = [];
  
  // Check images sequentially (1, 2, 3, ...) and stop when we hit a missing one
  for (let i = 1; i <= maxCheck; i++) {
    const url = `${BLOB_BASE_URL}/${folder}/${vin}/${i}.png`;
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
  const match = url.match(/\/(\d+)\.png$/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Build upload URL for Azure Blob Storage
 * Note: This requires SAS token or proper authentication
 */
export function buildUploadUrl(vin: string, typeId: number, imageNumber: number): string {
  const folder = getTypeFolderName(typeId);
  return `${BLOB_BASE_URL}/${folder}/${vin}/${imageNumber}.png`;
}
