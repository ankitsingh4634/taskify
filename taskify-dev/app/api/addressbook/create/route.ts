import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST(req: Request) {
  const cookieName = process.env.NEXTAUTH_COOKIE_NAME || 'authjs.session-token';
  const body = await req.json();
  const { fullName, emails, phones, address, organization, title } = body;

  // Validate required fields
  if (!fullName || (!phones || phones.length === 0)) {
    return NextResponse.json({ message: 'Name and at least one phone number are required' }, { status: 400 });
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
      emails: emails.map(email => email.email), // Extracting email strings
      phones: phones.map(phone => phone.phone), // Extracting phone strings
      address,
      organization,
      title,
      uid: uniqueUID,
    });

    if (!carddavResponse.ok) {
      const errorMessage = await carddavResponse.text();
      console.error('CardDAV sync failed:', errorMessage);
      return NextResponse.json({ message: 'Failed to sync with CardDAV' }, { status: 500 });
    }

    // Prepare email and phone numbers as comma-separated strings
    const emailList = emails.map(email => email.email).join(', '); // Join emails with commas
    const phoneList = phones.map(phone => phone.phone).join(', '); // Join phones with commas
    
    // Store the contact in the database
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO contacts (userId, fullName, email, phone, address, organization, title, carddav_uid) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, fullName, emailList || null, phoneList || null, address || null, organization || null, title || null, uniqueUID]
    );
    
    const contactId = result.insertId;

    // Note: You can omit storeMultipleEntries if you already inserted emails and phones
    // await storeMultipleEntries(contactId, emails, phones); // Optional, depends on your logic

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

// Store multiple entries for emails and phones in the database
async function storeMultipleEntries(contactId: number, emails: { email: string }[], phones: { phone: string }[]) {
  const emailList = emails.map(({ email }) => email).join(', '); // Join emails with commas
  const phoneList = phones.map(({ phone }) => phone).join(', '); // Join phones with commas

  await pool.query<ResultSetHeader>(
    `UPDATE contacts SET email = ?, phone = ? WHERE id = ?`,
    [emailList, phoneList, contactId]
  );
}

// Helper function to sync multiple contacts to CardDAV
async function syncToCardDAV({ fullName, emails, phones, address, organization, title, uid }: any) {
  const url = `https://www.fgquest.net/dav.php/addressbooks/8wiretest/default/${uid}.vcf`;

  let vcardData = `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
UID:${uid}`;

  // Add multiple phone numbers
  phones.forEach((phone: string) => {
    vcardData += `\nTEL:${phone}`;
  });

  // Add multiple emails
  if (emails) {
    emails.forEach((email: string) => {
      vcardData += `\nEMAIL:${email}`;
    });
  }

  if (address) vcardData += `\nADR:${address}`;
  if (organization) vcardData += `\nORG:${organization}`;
  if (title) vcardData += `\nTITLE:${title}`;

  vcardData += `\nEND:VCARD`;

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
