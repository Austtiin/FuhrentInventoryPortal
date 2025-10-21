/**
 * Image utilities for loading vehicle images from Azure Blob Storage
 */

// Get the base URL for images
export function getImageBaseUrl(): string {
  // In both dev and production, use the same Azure blob storage URL
  return process.env.NEXT_PUBLIC_IMG_BASE_URL || 
         process.env.IMGBaseURL || 
         'https://storageinventoryflatt.blob.core.windows.net/invpics/units/';
}

/**
 * Get the URL for a specific vehicle image
 * @param vin - Vehicle VIN
 * @param imageNumber - Image number (1, 2, 3, etc.)
 * @param extension - File extension (default: 'png')
 */
export function getVehicleImageUrl(vin: string, imageNumber: number, extension: string = 'png'): string {
  const baseUrl = getImageBaseUrl();
  // Remove trailing slash if present, then add VIN folder and image
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/${vin}/${imageNumber}.${extension}`;
}

/**
 * Get multiple vehicle image URLs
 * @param vin - Vehicle VIN
 * @param maxImages - Maximum number of images to try (default: 10)
 * @param extensions - File extensions to try (default: ['png', 'jpg', 'jpeg'])
 */
export function getVehicleImageUrls(vin: string, maxImages: number = 10, extensions: string[] = ['png', 'jpg', 'jpeg']): string[] {
  const urls: string[] = [];
  
  for (let i = 1; i <= maxImages; i++) {
    for (const ext of extensions) {
      urls.push(getVehicleImageUrl(vin, i, ext));
    }
  }
  
  return urls;
}

/**
 * Check if an image exists at a given URL
 * @param url - Image URL to check
 * @returns Promise<boolean> - True if image exists and loads successfully
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the first available image for a vehicle
 * @param vin - Vehicle VIN
 * @param maxImages - Maximum number of images to check (default: 10)
 * @param extensions - File extensions to try (default: ['png', 'jpg', 'jpeg'])
 * @returns Promise<string | null> - URL of first available image or null
 */
export async function getFirstAvailableImage(vin: string, maxImages: number = 10, extensions: string[] = ['png', 'jpg', 'jpeg']): Promise<string | null> {
  for (let i = 1; i <= maxImages; i++) {
    for (const ext of extensions) {
      const url = getVehicleImageUrl(vin, i, ext);
      const exists = await checkImageExists(url);
      if (exists) {
        return url;
      }
    }
  }
  return null;
}

/**
 * Get all available images for a vehicle
 * @param vin - Vehicle VIN
 * @param maxImages - Maximum number of images to check (default: 10)
 * @param extensions - File extensions to try (default: ['png', 'jpg', 'jpeg'])
 * @returns Promise<string[]> - Array of available image URLs
 */
export async function getAllAvailableImages(vin: string, maxImages: number = 10, extensions: string[] = ['png', 'jpg', 'jpeg']): Promise<string[]> {
  const availableImages: string[] = [];
  
  for (let i = 1; i <= maxImages; i++) {
    for (const ext of extensions) {
      const url = getVehicleImageUrl(vin, i, ext);
      const exists = await checkImageExists(url);
      if (exists) {
        availableImages.push(url);
        break; // Found image for this number, move to next number
      }
    }
  }
  
  return availableImages;
}

/**
 * Get image data for API responses
 * @param vin - Vehicle VIN
 * @param maxImages - Maximum number of images to check
 * @returns Promise with image data
 */
export async function getVehicleImageData(vin: string, maxImages: number = 10) {
  const images = await getAllAvailableImages(vin, maxImages);
  
  return {
    success: true,
    vin,
    images: images.map((url, index) => ({
      url,
      thumbnail: url, // For now, use same URL for thumbnail
      alt: `${vin} - Image ${index + 1}`,
      order: index + 1
    })),
    totalImages: images.length
  };
}