import { NextRequest, NextResponse } from 'next/server';
import { getVehicleImageData } from '@/lib/imageUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('typeId') || '2';
    const single = searchParams.get('single') === 'true';
    
    if (!vin) {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      );
    }

    console.log(`🖼️ Fetching images for VIN: ${vin}, TypeID: ${typeId}, Single: ${single}`);
    
    // Get vehicle images from Azure blob storage
    const maxImages = single ? 1 : 10;
    const imageData = await getVehicleImageData(vin, maxImages);
    
    return NextResponse.json(imageData);

  } catch (error) {
    console.error('❌ Error fetching images:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching images'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    
    if (!vin) {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      );
    }

    // TODO: Handle image upload to Azure Blob Storage
    console.log(`📸 Uploading image for VIN: ${vin}`);
    
    // Mock upload success
    return NextResponse.json(
      {
        success: true,
        message: 'Image uploaded successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while uploading image'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const body = await request.json();
    const { imageUrl } = body;
    
    if (!vin || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'VIN and imageUrl are required' },
        { status: 400 }
      );
    }

    // TODO: Delete image from Azure Blob Storage
    console.log(`🗑️ Deleting image ${imageUrl} for VIN: ${vin}`);
    
    // Mock deletion success
    return NextResponse.json(
      {
        success: true,
        message: 'Image deleted successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while deleting image'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const body = await request.json();
    const { newOrder } = body;
    
    if (!vin || !newOrder) {
      return NextResponse.json(
        { success: false, error: 'VIN and newOrder are required' },
        { status: 400 }
      );
    }

    // TODO: Update image order in database/storage
    console.log(`🔄 Reordering images for VIN: ${vin}`, newOrder);
    
    // Mock reorder success
    return NextResponse.json(
      {
        success: true,
        message: 'Images reordered successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error reordering images:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while reordering images'
      },
      { status: 500 }
    );
  }
}