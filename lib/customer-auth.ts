import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface CustomerUser {
  userId: string;
  customerId: string;
  email: string;
  role: string;
}

/**
 * Verify customer JWT token from request headers
 */
export async function verifyCustomerToken(request: NextRequest): Promise<CustomerUser | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify session exists and is not expired
    const sessionResult = await pool.query(
      `SELECT * FROM customer_sessions 
       WHERE session_token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return null;
    }

    // Update last activity
    await pool.query(
      `UPDATE customer_sessions SET last_activity = NOW() WHERE session_token = $1`,
      [token]
    );

    return {
      userId: decoded.userId,
      customerId: decoded.customerId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: CustomerUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role);
}

/**
 * Middleware to protect customer portal routes
 */
export async function requireAuth(request: NextRequest) {
  const user = await verifyCustomerToken(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
