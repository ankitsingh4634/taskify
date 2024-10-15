import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(req: Request) {
  const { taskId } = await req.json();

  if (!taskId) {
    return NextResponse.json(
      { message: 'Task ID is required' },
      { status: 400 }
    );
  }

  try {
    const [taskResult]: any = await pool.query(
      `SELECT caldav_uid FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (!taskResult.length) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    const caldavUid = taskResult[0].caldav_uid;
    const caldavUrl = `https://www.fgquest.net/dav.php/calendars/8wiretest/default/${caldavUid}.ics`;

    const [dbResult]: any = await pool.query(`DELETE FROM tasks WHERE id = ?`, [
      taskId
    ]);

    if (dbResult.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Task not found in database' },
        { status: 404 }
      );
    }

    const caldavResponse = await fetch(caldavUrl, {
      method: 'DELETE',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from('8wiretest:8wiretest654123!!').toString('base64')
      }
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
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting task:', error.message);
    return NextResponse.json(
      { message: 'Error deleting task' },
      { status: 500 }
    );
  }
}
