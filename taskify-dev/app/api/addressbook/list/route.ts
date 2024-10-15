import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

export async function GET(req: Request) {
  const secret = process.env.NEXTAUTH_SECRET;
  const cookieName = process.env.NEXTAUTH_COOKIE_NAME || 'authjs.session-token';

  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not defined');
  }

  //@ts-ignore
  const token = await getToken({
    req,
    secret,
    cookieName: cookieName,
  });

  if (!token) {
    console.error('Unauthorized - No token found');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;

  try {
    const [contacts] = await pool.query(
      `SELECT id, fullName, email, phone, address, organization, title, created_at, updated_at
       FROM contacts
       WHERE userId = ?`,
      [userId]
    );

    return NextResponse.json(contacts, { status: 200 });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { message: 'Error fetching contacts' },
      { status: 500 }
    );
  }
}
