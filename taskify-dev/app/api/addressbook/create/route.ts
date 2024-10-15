import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST(req: Request) {
  const cookieName = process.env.NEXTAUTH_COOKIE_NAME || 'authjs.session-token';
  const body = await req.json();
  const { fullName, email, phone, address, organization, title } = body;

  if (!fullName || !email || !phone || !address || !organization || !title) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not defined');
  }

  //@ts-ignore
  const token = await getToken({ req, secret, cookieName });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const Email = token.email;

  try {
    const uniqueUID = `${Date.now()}-${Email}`;

    // Sync with CardDAV
    const carddavResponse = await syncToCardDAV({
      fullName,
      email,
      phone,
      address,
      organization,
      title,
      uid: uniqueUID
    });

    if (!carddavResponse.ok) {
      const errorMessage = await carddavResponse.text();
      console.error('CardDAV sync failed:', errorMessage);
      return NextResponse.json({ message: 'Failed to sync with CardDAV' }, { status: 500 });
    }

    // Store in MySQL database
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO contacts (userId, fullName, email, phone, address, organization, title, carddav_uid) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, fullName, email, phone, address, organization, title, uniqueUID]
    );

    const contactId = result.insertId;

    return NextResponse.json(
      { message: 'Contact created successfully', contactId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating contact:', error.message);
    return NextResponse.json(
      { message: `Error creating contact: ${error.message}` },
      { status: 500 }
    );
  }
}

async function syncToCardDAV({
  fullName,
  email,
  phone,
  address,
  organization,
  title,
  uid,
}: any) {
  const url = `https://www.fgquest.net/dav.php/addressbooks/8wiretest/default/${uid}.vcf`;

  const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
EMAIL:${email}
TEL:${phone}
ADR:${address}
ORG:${organization}
TITLE:${title}
UID:${uid}
END:VCARD`;

  const authHeader = 'Basic ' + Buffer.from('8wiretest:8wiretest654123!!').toString('base64');

  const carddavResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/vcard',
      Authorization: authHeader,
    },
    body: vcardData,
  });

  if (!carddavResponse.ok) {
    const errorMessage = await carddavResponse.text();
    console.error('CardDAV sync failed:', errorMessage);
    throw new Error(`CardDAV sync failed: ${errorMessage}`);
  }

  return carddavResponse;
}
