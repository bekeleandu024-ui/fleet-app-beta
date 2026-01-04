import { NextResponse } from 'next/server';
import {
  getLocationById,
  updateLocation,
  deleteLocation,
  type UpdateLocationInput,
} from '@/lib/services/locations-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const location = await getLocationById(params.id);

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: location });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const input: UpdateLocationInput = {
      name: body.name,
      type: body.type,
      city: body.city,
      state: body.state,
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      zip: body.zip,
      country: body.country,
      latitude: body.latitude,
      longitude: body.longitude,
      is_active: body.is_active,
      notes: body.notes,
    };

    const location = await updateLocation(params.id, input);

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: location });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteLocation(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
