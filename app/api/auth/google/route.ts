import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { OAuth2Client } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    const { credential, email, name, googleId } = await request.json();

    if (!credential && !googleId) {
      return NextResponse.json(
        { error: 'Credential or googleId is required' },
        { status: 400 }
      );
    }

    let verifiedEmail: string;
    let verifiedName: string;
    let verifiedGoogleId: string;

    // If credential is provided, verify it with Google
    if (credential) {
      try {
        const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error('Invalid token payload');
        }

        verifiedEmail = payload.email || '';
        verifiedName = payload.name || 'User';
        verifiedGoogleId = payload.sub || '';

        if (!verifiedEmail) {
          return NextResponse.json(
            { error: 'Could not extract email from Google account' },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error('Token verification error:', error);
        return NextResponse.json(
          { error: 'Failed to verify Google token' },
          { status: 401 }
        );
      }
    } else {
      // Fallback for demo purposes
      verifiedEmail = email;
      verifiedName = name || 'User';
      verifiedGoogleId = googleId;
    }

    // Check if user exists by Google ID
    const existingGoogleUser = await query(
      'SELECT id, email, name FROM users WHERE provider_id = $1 AND provider = $2',
      [verifiedGoogleId, 'google']
    );

    let userId;
    let user;

    if (existingGoogleUser.rows.length > 0) {
      // User exists, log them in
      user = existingGoogleUser.rows[0];
      userId = user.id;
    } else {
      // Check if email exists with different provider
      const emailUser = await query(
        'SELECT id, email, name FROM users WHERE email = $1',
        [verifiedEmail]
      );

      if (emailUser.rows.length > 0) {
        // Link Google account to existing email account
        user = emailUser.rows[0];
        userId = user.id;
        await query(
          'UPDATE users SET provider_id = $1, provider = $2 WHERE id = $3',
          [verifiedGoogleId, 'google', userId]
        );
      } else {
        // Create new user
        const result = await query(
          'INSERT INTO users (email, name, provider, provider_id) VALUES ($1, $2, $3, $4) RETURNING id',
          [verifiedEmail, verifiedName, 'google', verifiedGoogleId]
        );
        userId = result.rows[0].id;
        user = { id: userId, email: verifiedEmail, name: verifiedName };
      }
    }

    const token = generateToken(userId);

    return NextResponse.json({
      message: 'Google login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'An error occurred during Google login' },
      { status: 500 }
    );
  }
}
