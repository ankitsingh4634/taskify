'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/Spinner';
import { Clipboard } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment'; // Import moment
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Calendar', link: '/dashboard/calendar' }
];

export default function TaskCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/task/list', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setEvents(
          data.map((task: any) => ({
            ...task,
            start: parseISO(task.startTime),
            end: parseISO(task.endTime),
          }))
        );
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleEventClick = (event: any) => {
    setSelectedTask(event);
    setTaskTitle(event.title);
    setTaskDescription(event.description);
    setTaskStatus(event.status);
    setDialogOpen(true);
  };

  const handleTaskUpdate = async () => {
    const updatedTask = {
      id: selectedTask.id,
      title: taskTitle,
      description: taskDescription,
      status: taskStatus,
      startTime: format(selectedTask.start, "yyyy-MM-dd'T'HH:mm:ss"),
      endTime: format(selectedTask.end, "yyyy-MM-dd'T'HH:mm:ss"),
    };

    try {
      const res = await fetch('/api/user/task/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });

      if (res.ok) {
        fetchTasks();
        setDialogOpen(false);
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-col items-start justify-between">
          <Heading title="Calendar" description="View and manage your tasks on the calendar" />
        </div>

        <Separator />
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clipboard className="mb-4 h-12 w-12 text-gray-500" />
            <p className="text-lg text-gray-500">No tasks available</p>
          </div>
        ) : (
        
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '400px', margin: '0' }} // Set height to fit all events in one frame
              onSelectEvent={handleEventClick}
              tooltipAccessor={event => event.description} // Show event description on hover
              components={{
                event: ({ event }) => (
                  <span>
                    <strong>{event.title}</strong>
                    <br />
                    <small>{event.description}</small>
                  </span>
                ),
              }}
            />
          
        )}

        {/* Task Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <Input placeholder="Task Description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
                className="w-full rounded border p-2"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <DialogFooter>
                <Button onClick={handleTaskUpdate}>Update Task</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
