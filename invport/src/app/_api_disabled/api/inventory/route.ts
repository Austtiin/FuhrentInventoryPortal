import { NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function GET() {
  try {
    // Call external API to get inventory
    const response = await callExternalApi('inventory');
    const result = await response.json();
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}