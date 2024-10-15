import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(req: Request) {
  const { contactId } = await req.json(); // Expecting the contactId to be passed in the request body

  if (!contactId) {
    return NextResponse.json(
      { message: 'Contact ID is required' },
      { status: 400 }
    );
  }

  try {
    // Check if the contact exists
    const [contactResult]: any = await pool.query(
      `SELECT carddav_uid FROM contacts WHERE id = ?`,
      [contactId]
    );

    if (!contactResult.length) {
      return NextResponse.json({ message: 'Contact not found' }, { status: 404 });
    }

    const carddavUid = contactResult[0].carddav_uid;
    const carddavUrl = `https://www.fgquest.net/dav.php/addressbooks/8wiretest/default/${carddavUid}.vcf`; // Update to the appropriate URL if necessary

    // Delete from the database
    const [dbResult]: any = await pool.query(`DELETE FROM contacts WHERE id = ?`, [
      contactId,
    ]);

    if (dbResult.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Contact not found in database' },
        { status: 404 }
      );
    }

    // Optionally delete from CalDAV if needed
    const caldavResponse = await fetch(carddavUrl, {
      method: 'DELETE',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from('8wiretest:8wiretest654123!!').toString('base64'),
      },
    });

    if (!caldavResponse.ok) {
      const errorMessage = await caldavResponse.text();
      console.error('Error deleting from CalDAV:', errorMessage);
      return NextResponse.json(
        { message: 'Failed to delete from CalDAV' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Contact deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting contact:', error.message);
    return NextResponse.json(
      { message: 'Error deleting contact' },
      { status: 500 }
    );
  }
}
