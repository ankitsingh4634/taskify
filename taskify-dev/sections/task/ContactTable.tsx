import React, { useState } from 'react';
import { Edit, Trash } from 'lucide-react';
import { EditContactDialog } from '@/components/modal/EditContactDialog'; // Import the modal for editing contacts
import { Button } from '@/components/ui/button';

// Define types for props
interface Contact {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface ContactTableProps {
  contacts: Contact[];
  onDelete: (id: number) => void;
  onUpdate: (updatedContact: Contact) => void;
}

const ContactTable: React.FC<ContactTableProps> = ({ contacts, onDelete, onUpdate }) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);  // Set the contact to be edited
    setIsEditModalOpen(true);     // Open the edit modal
  };

  const handleUpdate = (updatedContact: Contact) => {
    onUpdate(updatedContact);     // Call the update function
    setIsEditModalOpen(false);    // Close the edit modal after saving
  };

  return (
    <div>
      <table className="min-w-full border-collapse border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Contact Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Phone</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
       
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td className="border px-4 py-2">{contact.fullName}</td>
              <td className="border px-4 py-2">{contact.email}</td>
              <td className="border px-4 py-2">{contact.phone}</td>
              <td className="border px-4 py-2 flex space-x-2">
                <Button variant="ghost" onClick={() => handleEdit(contact)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => onDelete(contact.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        
        </tbody>
      </table>

      {/* Render the EditContactDialog modal */}
      {selectedContact && (
        <EditContactDialog
          contact={selectedContact}
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default ContactTable;
