'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import ContactTable from './ContactTable';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Plus, Clipboard, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { EditContactDialog } from '@/components/modal/EditContactDialog';
const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Contacts', link: '/dashboard/contacts' }
];

export default function ContactListingPage() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    setFilteredContacts(
      contacts.filter((contact) =>
        contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery)
      )
    );
  }, [searchQuery, contacts]);

  async function fetchContacts() {
    setLoading(true);
    const res = await fetch('/api/addressbook/list', {
      method: 'GET',
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      setContacts(data);
      setFilteredContacts(data);
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

  const handleUpdate = (contact) => {
    setSelectedContact(contact); // Set the selected contact data
    setIsEditModalOpen(true); // Open the modal
  };

  const handleSave = async (updatedContact) => {
    const contactData = {
      contactId: updatedContact.id,
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
        body: JSON.stringify(contactData),
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

      fetchContacts();
      setIsEditModalOpen(false); // Close modal after save
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
          <Heading title={`Contacts (${filteredContacts.length})`} description="Manage your contacts" />
          <Link href={'/dashboard/contacts/new'} className={cn(buttonVariants({ variant: 'default' }))}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-1/3"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center">Loading...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clipboard className="mb-4 h-12 w-12 text-gray-500" />
            <p className="text-lg text-gray-500">No contacts available</p>
            <Link href={'/dashboard/contacts/new'} className={cn(buttonVariants({ variant: 'default' }), 'mt-4')}>
              <Plus className="mr-2 h-4 w-4" /> Add New Contact
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <ContactTable contacts={filteredContacts} loading={loading} deleting={deleting} onDelete={handleDelete} onUpdate={handleUpdate} />
            </div>
            <div className="md:hidden grid grid-cols-1 gap-4 overflow-y-scroll max-h-[calc(100vh-200px)]">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="bg-white shadow rounded-lg p-4 flex flex-col space-y-2">
                  <div className="font-semibold text-lg">{contact.fullName}</div>
                  <div>{contact.email}</div>
                  <div>{contact.phone}</div>
                  <div>{contact.address}</div>
                  <div>{contact.organization}</div>
                  <div>{contact.title}</div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => handleUpdate(contact)} className="bg-blue-500 text-white px-3 py-1 rounded">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(contact.id)} className="bg-red-500 text-white px-3 py-1 rounded">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal for editing contacts */}
      {isEditModalOpen && selectedContact && (
  <EditContactDialog
    contact={selectedContact}
    open={isEditModalOpen}
    onClose={() => setIsEditModalOpen(false)}
    onUpdate={handleSave} // Adjust this to match your update function
  />
)}
    
    </PageContainer>
  );
}
