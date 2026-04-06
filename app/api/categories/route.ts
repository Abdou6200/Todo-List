import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const result = await query(
      'SELECT id, name FROM categories WHERE user_id = $1 ORDER BY name ASC',
      [decoded.userId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id, name',
      [decoded.userId, name.trim()]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    
    // Check if it's a unique constraint error
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while creating category' },
      { status: 500 }
    );
  }
}
