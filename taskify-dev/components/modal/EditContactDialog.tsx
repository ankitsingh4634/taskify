import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface EditContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (contact: Contact) => void;
}

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  contact,
  open,
  onClose,
  onUpdate
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (contact) {
      setFullName(contact.fullName);
      setEmail(contact.email);
      setPhone(contact.phone);
    }
  }, [contact]);

  const handleSubmit = () => {
    if (contact) {
      // Ensure we pass the correct contact object with ID
      onUpdate({ ...contact, fullName, email, phone });
    } else {
      // For adding new contact functionality
      const newContact: Contact = { id: Date.now(), fullName, email, phone }; // Ensure ID generation
      onUpdate(newContact);
    }
    onClose();
  };

  return (
    <Modal title={contact ? 'Edit Contact' : 'Add Contact'} isOpen={open} onClose={onClose}>
      <div className="space-y-4 p-4">
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save</Button>
      </div>
    </Modal>
  );
};
