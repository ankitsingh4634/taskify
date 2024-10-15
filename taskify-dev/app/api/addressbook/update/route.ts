import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function PUT(req: Request) {
  const secret = process.env.NEXTAUTH_SECRET;
  const cookieName = process.env.NEXTAUTH_COOKIE_NAME || 'authjs.session-token';

  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not defined');
  }

  // Get the user's token from the request
  //@ts-ignore
  const token = await getToken({
    req,
    secret,
    cookieName
  });

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const body = await req.json();
  const { contactId, fullName, email, phone, address, organization, title } = body;

  // Validate the request data
  if (!contactId || !fullName || !email) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    // Check if the contact exists
    const [contactResult]: any = await pool.query(
      `SELECT carddav_uid FROM contacts WHERE id = ? AND userId = ?`,
      [contactId, userId]
    );

    if (!contactResult.length) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }

    const carddavUid = contactResult[0].carddav_uid;

    // Sync the updated contact to CardDAV if needed
    const caldavResponse = await syncToCalDAV({
      uid: carddavUid,
      fullName,
      email,
      phone,
      address,
      organization,
      title
    });

    if (!caldavResponse.ok) {
      const errorMessage = await caldavResponse.text();
      console.error('CalDAV sync failed:', errorMessage);
      return NextResponse.json(
        { message: 'Failed to sync with CalDAV' },
        { status: 500 }
      );
    }

    // Update the contact in the database
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE contacts
         SET fullName = ?, email = ?, phone = ?, address = ?, organization = ?, title = ?
         WHERE id = ? AND userId = ?`,
        [
          fullName,
          email,
          phone,
          address,
          organization,
          title,
          contactId,
          userId
        ]
      );
  
      // Check if any rows were affected
      if (result.affectedRows === 0) {
        return NextResponse.json({ message: 'No changes made' }, { status: 204 }); // No Content
      }
  
      return NextResponse.json(
        { message: 'Contact updated successfully' },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error updating contact:', error.message);
      return NextResponse.json(
        { message: 'Error updating contact' },
        { status: 500 }
      );
    }
  }
  

// Helper function to sync contact to CardDAV
async function syncToCalDAV({
  uid,
  fullName,
  email,
  phone,
  address,
  organization,
  title
}: any) {
  const url = `https://www.fgquest.net/dav.php/addressbooks/8wiretest/default/${uid}.vcf`; // Update the URL accordingly

  const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
EMAIL:${email}
TEL:${phone}
ADR:${address}
ORG:${organization}
TITLE:${title}
UID:${uid}
END:VCARD`;

  return await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/vcard',
      Authorization:
        'Basic ' + Buffer.from('8wiretest:8wiretest654123!!').toString('base64')
    },
    body: vCardData
  });
}
