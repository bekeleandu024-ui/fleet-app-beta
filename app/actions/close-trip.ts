"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

export async function closeTrip(tripId: string) {
  try {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE trips 
         SET status = 'closed', closed_at = NOW() 
         WHERE id = $1`,
        [tripId]
      );
    } finally {
      client.release();
    }
    
    revalidatePath("/trips");
    revalidatePath("/trips/closed");
    return { success: true };
  } catch (error) {
    console.error("Error closing trip:", error);
    return { success: false, error: "Failed to close trip" };
  }
}
