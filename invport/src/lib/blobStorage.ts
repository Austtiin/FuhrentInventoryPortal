/**
 * Azure Blob Storage Utilities for Inventory Images
 * 
 * Storage Structure:
 * - https://storageinventoryflatt.blob.core.windows.net/invpics/units/
 *   - /{VIN}/1.png, 2.png, ...
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
export function getImageUrl(vin: string, typeId: number, imageNumber: number, extension: string = 'png'): string {
  const baseUrl = getImageBaseUrl();
  return `${baseUrl}${vin}/${imageNumber}.${extension}`;
}

/**
 * Get all image URLs for a VIN
 * Returns array of image URLs in order (IMG_001.png, IMG_002.png, etc.)
 */
export function getAllImageUrls(vin: string, typeId: number, maxImages: number = 10, extensions: string[] = ['png','jpg','jpeg']): string[] {
  const baseUrl = getImageBaseUrl();
  const urls: string[] = [];
  
  for (let i = 1; i <= maxImages; i++) {
    for (const ext of extensions) {
      urls.push(`${baseUrl}${vin}/${i}.${ext}`);
    }
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
export async function loadExistingImages(vin: string, typeId: number, maxCheck: number = 10, extensions: string[] = ['png','jpg','jpeg']): Promise<string[]> {
  const baseUrl = getImageBaseUrl();
  const existingImages: string[] = [];
  
  // Check images sequentially (1.png, 2.jpg, ...) and stop when we hit a missing one
  for (let i = 1; i <= maxCheck; i++) {
    let found = false;
    for (const ext of extensions) {
      const url = `${baseUrl}${vin}/${i}.${ext}`;
      const exists = await checkImageExists(url);
      if (exists) {
        existingImages.push(url);
        found = true;
        break;
      }
    }
    if (!found) break;
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
  const match = url.match(/\/(\d+)\.(png|jpg|jpeg|webp|gif)$/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Build upload URL for Azure Blob Storage
 * Note: This requires SAS token or proper authentication
 */
export function buildUploadUrl(vin: string, typeId: number, imageNumber: number, extension: string = 'png'): string {
  const baseUrl = getImageBaseUrl();
  return `${baseUrl}${vin}/${imageNumber}.${extension}`;
}
