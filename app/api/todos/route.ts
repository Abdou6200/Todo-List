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
      `SELECT t.*, c.name as category_name FROM todos t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 ORDER BY t.created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Get todos error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching todos' },
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

    const { title, description, category_id, due_date } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO todos (user_id, category_id, title, description, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [decoded.userId, category_id || null, title, description || '', due_date || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Create todo error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating todo' },
      { status: 500 }
    );
  }
}
