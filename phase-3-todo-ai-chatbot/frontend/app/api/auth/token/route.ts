/**
 * JWT Token Generation API Route
 *
 * Generates HS256 JWT tokens for authenticated users.
 * Uses BETTER_AUTH_SECRET for signing (same as FastAPI backend).
 *
 * This endpoint:
 * 1. Validates user session via Better Auth
 * 2. Generates HS256 JWT with user info
 * 3. Returns token for use with backend API
 *
 * The token is compatible with FastAPI backend's jwt.py verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { SignJWT } from 'jose';

export async function GET(request: NextRequest) {
  // Get secret at runtime (not build time)
  const secretKey = process.env.BETTER_AUTH_SECRET;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Configuration Error', message: 'Auth secret not configured' },
      { status: 500 }
    );
  }
  const secret = new TextEncoder().encode(secretKey);
  try {
    // Get current session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No active session' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Generate HS256 JWT token compatible with FastAPI backend
    const token = await new SignJWT({
      sub: user.id,           // User ID (required by backend)
      email: user.email,      // User email
      name: user.name,        // User name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')  // 1 hour expiration
      .sign(secret);

    return NextResponse.json({
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
