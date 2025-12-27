import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { formatError } from "@/lib/api-errors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";
const REFRESH_EXPIRES_IN = "7d";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  customerId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['admin', 'viewer', 'billing', 'dispatcher']).default('viewer'),
});

/**
 * POST /api/portal/auth/login
 * Customer user login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a login or register request
    const action = body.action || 'login';
    
    if (action === 'register') {
      return handleRegister(body, request);
    } else {
      return handleLogin(body, request);
    }
  } catch (error) {
    console.error("Auth error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: formatError(error) },
      { status: 500 }
    );
  }
}

async function handleLogin(body: any, request: NextRequest) {
  const data = loginSchema.parse(body);
  
  // Find user
  const userResult = await pool.query(
    `SELECT * FROM customer_users WHERE email = $1 AND is_active = TRUE`,
    [data.email]
  );
  
  if (userResult.rows.length === 0) {
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }
  
  const user = userResult.rows[0];
  
  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return NextResponse.json(
      { success: false, error: "Account temporarily locked. Try again later." },
      { status: 403 }
    );
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(data.password, user.password_hash);
  
  if (!passwordMatch) {
    // Increment failed attempts
    await pool.query(
      `UPDATE customer_users 
       SET failed_login_attempts = failed_login_attempts + 1,
           locked_until = CASE 
             WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
             ELSE NULL 
           END
       WHERE id = $1`,
      [user.id]
    );
    
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }
  
  // Generate tokens
  const accessToken = jwt.sign(
    {
      userId: user.id,
      customerId: user.customer_id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
  
  // Get request metadata
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;
  
  // Create session
  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + 24);
  
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);
  
  await pool.query(
    `INSERT INTO customer_sessions (
      customer_user_id, session_token, refresh_token, 
      ip_address, user_agent, expires_at, refresh_expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [user.id, accessToken, refreshToken, ipAddress, userAgent, sessionExpiry, refreshExpiry]
  );
  
  // Update user login info
  await pool.query(
    `UPDATE customer_users 
     SET last_login = NOW(), 
         login_count = login_count + 1,
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE id = $1`,
    [user.id]
  );
  
  // Log audit
  await pool.query(
    `INSERT INTO customer_audit_log (customer_id, customer_user_id, action, ip_address, user_agent)
     VALUES ($1, $2, 'login', $3, $4)`,
    [user.customer_id, user.id, ipAddress, userAgent]
  );
  
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      customerId: user.customer_id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
}

async function handleRegister(body: any, request: NextRequest) {
  const data = registerSchema.parse(body);
  
  // Check if email already exists
  const existingUser = await pool.query(
    `SELECT id FROM customer_users WHERE email = $1`,
    [data.email]
  );
  
  if (existingUser.rows.length > 0) {
    return NextResponse.json(
      { success: false, error: "Email already registered" },
      { status: 409 }
    );
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  // Create user
  const result = await pool.query(
    `INSERT INTO customer_users (
      customer_id, email, password_hash, name, phone, role
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, customer_id, email, name, role`,
    [data.customerId, data.email, passwordHash, data.name, data.phone || null, data.role]
  );
  
  const user = result.rows[0];
  
  // Create default preferences
  await pool.query(
    `INSERT INTO customer_preferences (customer_id)
     VALUES ($1)
     ON CONFLICT (customer_id) DO NOTHING`,
    [data.customerId]
  );
  
  // Log audit
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;
  
  await pool.query(
    `INSERT INTO customer_audit_log (customer_id, customer_user_id, action, ip_address, user_agent)
     VALUES ($1, $2, 'register', $3, $4)`,
    [user.customer_id, user.id, ipAddress, userAgent]
  );
  
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      customerId: user.customer_id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    message: "Registration successful. Please log in.",
  });
}
