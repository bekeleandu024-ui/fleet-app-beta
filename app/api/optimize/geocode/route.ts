import { NextResponse } from "next/server";
import pool from "@/lib/db";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface GeocodeResult {
  tripId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  pickupError?: string;
  dropoffError?: string;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || !GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    
    console.warn(`Geocoding failed for "${address}": ${data.status}`);
    return null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
    return null;
  }
}

/**
 * POST /api/optimize/geocode
 * Geocodes trip addresses and updates the database
 */
export async function POST(request: Request) {
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { tripIds } = body; // Optional: specific trip IDs to geocode

    const client = await pool.connect();
    try {
      // Fetch trips that need geocoding
      let query = `
        SELECT 
          id,
          pickup_location,
          dropoff_location,
          pickup_lat,
          pickup_lng,
          dropoff_lat,
          dropoff_lng
        FROM trips
        WHERE status NOT IN ('completed', 'closed', 'cancelled')
          AND (
            pickup_lat IS NULL OR pickup_lng IS NULL OR
            dropoff_lat IS NULL OR dropoff_lng IS NULL
          )
      `;

      if (tripIds && tripIds.length > 0) {
        query += ` AND id = ANY($1)`;
      }

      query += ` LIMIT 20`; // Limit to avoid API rate limits

      const result = tripIds && tripIds.length > 0 
        ? await client.query(query, [tripIds])
        : await client.query(query);

      const results: GeocodeResult[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (const trip of result.rows) {
        const geocodeResult: GeocodeResult = {
          tripId: trip.id,
          pickupLocation: trip.pickup_location,
          dropoffLocation: trip.dropoff_location,
          pickupLat: trip.pickup_lat,
          pickupLng: trip.pickup_lng,
          dropoffLat: trip.dropoff_lat,
          dropoffLng: trip.dropoff_lng,
        };

        // Geocode pickup if needed
        if (!trip.pickup_lat || !trip.pickup_lng) {
          if (trip.pickup_location) {
            const pickupCoords = await geocodeAddress(trip.pickup_location);
            if (pickupCoords) {
              geocodeResult.pickupLat = pickupCoords.lat;
              geocodeResult.pickupLng = pickupCoords.lng;
            } else {
              geocodeResult.pickupError = "Could not geocode pickup address";
            }
          } else {
            geocodeResult.pickupError = "No pickup address";
          }
        }

        // Geocode dropoff if needed
        if (!trip.dropoff_lat || !trip.dropoff_lng) {
          if (trip.dropoff_location) {
            const dropoffCoords = await geocodeAddress(trip.dropoff_location);
            if (dropoffCoords) {
              geocodeResult.dropoffLat = dropoffCoords.lat;
              geocodeResult.dropoffLng = dropoffCoords.lng;
            } else {
              geocodeResult.dropoffError = "Could not geocode dropoff address";
            }
          } else {
            geocodeResult.dropoffError = "No dropoff address";
          }
        }

        // Update database if we got coordinates
        if (geocodeResult.pickupLat && geocodeResult.pickupLng && 
            geocodeResult.dropoffLat && geocodeResult.dropoffLng) {
          await client.query(
            `UPDATE trips 
             SET pickup_lat = $1, pickup_lng = $2, dropoff_lat = $3, dropoff_lng = $4, updated_at = NOW()
             WHERE id = $5`,
            [geocodeResult.pickupLat, geocodeResult.pickupLng, 
             geocodeResult.dropoffLat, geocodeResult.dropoffLng, trip.id]
          );
          successCount++;
        } else if (geocodeResult.pickupLat && geocodeResult.pickupLng) {
          // At least update pickup
          await client.query(
            `UPDATE trips SET pickup_lat = $1, pickup_lng = $2, updated_at = NOW() WHERE id = $3`,
            [geocodeResult.pickupLat, geocodeResult.pickupLng, trip.id]
          );
        } else if (geocodeResult.dropoffLat && geocodeResult.dropoffLng) {
          // At least update dropoff
          await client.query(
            `UPDATE trips SET dropoff_lat = $1, dropoff_lng = $2, updated_at = NOW() WHERE id = $3`,
            [geocodeResult.dropoffLat, geocodeResult.dropoffLng, trip.id]
          );
        }

        if (geocodeResult.pickupError || geocodeResult.dropoffError) {
          failedCount++;
        }

        results.push(geocodeResult);

        // Small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return NextResponse.json({
        success: true,
        processed: results.length,
        successfullyGeocoded: successCount,
        partialOrFailed: failedCount,
        results,
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode trips" },
      { status: 500 }
    );
  }
}
