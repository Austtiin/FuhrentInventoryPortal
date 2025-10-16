import { NextRequest, NextResponse } from 'next/server';

// Azure Storage configuration - Using direct URL
const STORAGE_URL = process.env.AZURE_STORAGE_URL || 'https://flattstorage.blob.core.windows.net/invpics';

/**
 * Get the folder name based on TypeID
 */
function getTypeFolderName(typeId: number): string {
  switch (typeId) {
    case 1: return 'fishhouses';
    case 2: return 'vehicles';
    case 3: return 'trailers';
    default: return 'vehicles';
  }
}

/**
 * Build the full URL for an image
 */
function buildImageUrl(folder: string, vin: string, imageNumber: number): string {
  return `${STORAGE_URL}/${folder}/${vin}/${imageNumber}.png`;
}

/**
 * GET /api/images/[vin]?typeId=X
 * List all images for a specific VIN
 * Note: This will attempt to fetch images 1-10 and return those that exist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const searchParams = request.nextUrl.searchParams;
    const typeId = parseInt(searchParams.get('typeId') || '2');

    if (!vin) {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      );
    }

    const folder = getTypeFolderName(typeId);
    
    // Check for images 1-10 by attempting to fetch them
    const images: Array<{ name: string; url: string; number: number }> = [];
    
    for (let i = 1; i <= 10; i++) {
      const imageUrl = buildImageUrl(folder, vin, i);
      
      try {
        // HEAD request to check if image exists
        const response = await fetch(imageUrl, { method: 'HEAD' });
        
        if (response.ok) {
          images.push({
            name: `${folder}/${vin}/${i}.png`,
            url: imageUrl,
            number: i
          });
        }
      } catch {
        // Image doesn't exist, skip
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      images,
      count: images.length
    });

  } catch (error) {
    console.error('Error listing images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list images' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/images/[vin]
 * Upload a new image for a VIN
 * Note: With URL-based storage, uploads should be handled server-side with proper credentials
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const typeId = parseInt(formData.get('typeId') as string || '2');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const folder = getTypeFolderName(typeId);

    // Get existing images to determine next number
    const existingImagesResponse = await GET(request, { params: Promise.resolve({ vin }) });
    const existingData = await existingImagesResponse.json();
    
    const maxNumber = existingData.images?.reduce((max: number, img: { number: number }) => 
      Math.max(max, img.number), 0) || 0;
    
    const nextNumber = maxNumber + 1;
    const imageUrl = buildImageUrl(folder, vin, nextNumber);

    // For now, return success with the expected URL
    // In production, implement actual upload with Azure Storage SAS tokens or server-side upload
    console.log(`📤 Would upload image to: ${imageUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl,
      imageNumber: nextNumber,
      message: 'Image upload endpoint ready (implement server-side upload with SAS token)'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images/[vin]?imageNumber=X&typeId=Y
 * Delete a specific image
 * Note: Requires server-side implementation with proper Azure Storage credentials
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const searchParams = request.nextUrl.searchParams;
    const imageNumber = parseInt(searchParams.get('imageNumber') || '0');
    const typeId = parseInt(searchParams.get('typeId') || '2');

    if (!imageNumber) {
      return NextResponse.json(
        { success: false, error: 'Image number is required' },
        { status: 400 }
      );
    }

    const folder = getTypeFolderName(typeId);
    const imageUrl = buildImageUrl(folder, vin, imageNumber);

    console.log(`🗑️ Would delete image: ${imageUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Delete endpoint ready (implement with Azure Storage SAS token or server-side credentials)'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/images/[vin]
 * Reorder images (rename based on new order)
 * Note: Requires server-side implementation with proper Azure Storage credentials
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const body = await request.json();
    const { newOrder, typeId } = body; // newOrder: array of current image numbers in desired order

    if (!Array.isArray(newOrder) || newOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order array' },
        { status: 400 }
      );
    }

    const folder = getTypeFolderName(typeId || 2);

    console.log(`🔄 Would reorder images for ${folder}/${vin}:`, newOrder);

    return NextResponse.json({
      success: true,
      message: 'Reorder endpoint ready (implement with Azure Storage SAS token or server-side credentials)'
    });

  } catch (error) {
    console.error('Error reordering images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder images' },
      { status: 500 }
    );
  }
}