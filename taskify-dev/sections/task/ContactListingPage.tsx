'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import ContactTable from './ContactTable'; // Create this component to display contacts
import { Breadcrumbs } from '@/components/breadcrumbs';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Plus, Clipboard, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Contacts', link: '/dashboard/contacts' }
];

export default function ContactListingPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    const res = await fetch('/api/addressbook/list', {
      method: 'GET',
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      setContacts(data);
    } else {
      toast({
        title: 'Error',
        description: (
          <>
            <XCircle className="mr-2 inline-block text-red-500" /> Failed to fetch contacts
          </>
        )
      });
    }
    setLoading(false);
  }

  async function handleDelete(contactId) {
    setDeleting(true);
    try {
      const res = await fetch('/api/addressbook/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: (
            <>
              <CheckCircle className="mr-2 inline-block text-green-500" /> Contact deleted successfully
            </>
          )
        });
        fetchContacts();
      } else {
        toast({
          title: 'Error',
          description: (
            <>
              <XCircle className="mr-2 inline-block text-red-500" /> Failed to delete contact
            </>
          )
        });
      }
    } catch (error) {
      console.log('➡️   ~ handleDelete ~ error:', error);
    } finally {
      setDeleting(false);
    }
  }

  const handleUpdate = async (updatedContact: Contact) => {
    // Adjust the object to match expected fields
    const contactData = {
      contactId: updatedContact.id, // Use contactId instead of id
      fullName: updatedContact.fullName,
      email: updatedContact.email,
      phone: updatedContact.phone,
      address: updatedContact.address,
      organization: updatedContact.organization,
      title: updatedContact.title
    };
  
    try {
      const res = await fetch(`/api/addressbook/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData), // Send the updated contact data
        credentials: 'include',
      });
  
      if (!res.ok) {
        throw new Error('Failed to update contact');
      }
  
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
        variant: 'success',
      });
  
      fetchContacts(); // Refresh contacts list
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact',
        variant: 'destructive',
      });
    }
  };
  
  

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={`Contacts (${contacts.length})`}
            description="Manage your contacts"
          />
          <Link
            href={'/dashboard/contacts/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        {loading ? (
          <div className="py-10 text-center">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clipboard className="mb-4 h-12 w-12 text-gray-500" />
            <p className="text-lg text-gray-500">No contacts available</p>
            <Link
              href={'/dashboard/contacts/new'}
              className={cn(buttonVariants({ variant: 'default' }), 'mt-4')}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Contact
            </Link>
          </div>
        ) : (
          <ContactTable
            contacts={contacts}
            loading={loading}
            deleting={deleting}
            onDelete={handleDelete}
            onUpdate={handleUpdate} // Pass update handler
          />
        )}
      </div>
    </PageContainer>
  );
}
