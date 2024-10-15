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
  const { taskId, title, description, startTime, endTime, status } = body;

  if (!taskId || !title || !startTime || !endTime || !status) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    );
  }

  const normalizedStatus = status.toLowerCase().replace(' ', '_') as
    | 'pending'
    | 'in_progress'
    | 'completed';

  if (!['pending', 'in_progress', 'completed'].includes(normalizedStatus)) {
    return NextResponse.json(
      { message: 'Invalid status value' },
      { status: 400 }
    );
  }

  try {
    // Fetch the CalDAV UID from the database
    const [taskResult]: any = await pool.query(
      `SELECT caldav_uid FROM tasks WHERE id = ? AND userId = ?`,
      [taskId, userId]
    );

    if (!taskResult.length) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    const caldavUid = taskResult[0].caldav_uid;

    // Sync the updated task to CalDAV
    const caldavResponse = await syncToCalDAV({
      uid: caldavUid,
      title,
      description,
      startTime,
      endTime,
      status: normalizedStatus
    });

    if (!caldavResponse.ok) {
      const errorMessage = await caldavResponse.text();
      console.error('CalDAV sync failed:', errorMessage);
      return NextResponse.json(
        { message: 'Failed to sync with CalDAV' },
        { status: 500 }
      );
    }

    // Update the task in the database
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tasks
       SET title = ?, description = ?, startTime = ?, endTime = ?, status = ?
       WHERE id = ? AND userId = ?`,
      [
        title,
        description,
        new Date(startTime),
        new Date(endTime),
        normalizedStatus,
        taskId,
        userId
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'No changes made' }, { status: 200 });
    }

    return NextResponse.json(
      { message: 'Task updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating task:', error.message);
    return NextResponse.json(
      { message: 'Error updating task' },
      { status: 500 }
    );
  }
}

// Helper function to sync task to CalDAV
async function syncToCalDAV({
  uid,
  title,
  description,
  startTime,
  endTime,
  status
}: any) {
  const url = `https://www.fgquest.net/dav.php/calendars/8wiretest/default/${uid}.ics`;

  const validStatus =
    status === 'pending'
      ? 'TENTATIVE'
      : status === 'in_progress'
      ? 'CONFIRMED'
      : status === 'completed'
      ? 'CONFIRMED'
      : 'CONFIRMED';

  const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Organization//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d{3}/g, '')}
DTSTART:${new Date(startTime).toISOString().replace(/-|:|\.\d{3}/g, '')}
DTEND:${new Date(endTime).toISOString().replace(/-|:|\.\d{3}/g, '')}
SUMMARY:${title}
DESCRIPTION:${description || ''}
STATUS:${validStatus}
END:VEVENT
END:VCALENDAR`;

  return await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/calendar',
      Authorization:
        'Basic ' + Buffer.from('8wiretest:8wiretest654123!!').toString('base64')
    },
    body: icsData
  });
}
