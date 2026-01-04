import { NextResponse } from 'next/server';
import {
  getLocations,
  createLocation,
  type LocationType,
  type CreateLocationInput,
} from '@/lib/services/locations-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as LocationType | null;

    const locations = await getLocations(type || undefined);

    return NextResponse.json({ data: locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.city || !body.state) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, city, state' },
        { status: 400 }
      );
    }

    // Validate location type
    const validTypes: LocationType[] = [
      'COMPANY_YARD',
      'CUSTOMER',
      'DRIVER_HOME',
      'DROP_YARD',
      'FUEL_STOP',
    ];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid location type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const input: CreateLocationInput = {
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
      notes: body.notes,
    };

    const location = await createLocation(input);

    return NextResponse.json({ data: location }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
