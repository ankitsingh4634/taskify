'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowBigLeft, CheckCircle, ChevronLeft, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/heading';
import Spinner from '@/components/ui/Spinner';
import { toast } from '@/components/ui/use-toast';

// Contact form schema
const contactSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please provide a valid email.' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  organization: z.string().optional(), // Add organization field
  title: z.string().optional() // Add title field
});

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Contacts', link: '/dashboard/contacts' },
  
];

export default function CreateContactForm() {
  const [loading, setLoading] = React.useState(false);
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      organization: '',
      title: ''
    }
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    setLoading(true);
    try {
      const res = await fetch('/api/addressbook/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const { message } = await res.json();
        console.error('Error creating contact:', message);
        toast({
          title: 'Error',
          description: (
            <>
              <XCircle className="mr-2 inline-block text-red-500" /> Failed to
              create contact with error: {message}
            </>
          )
        });
        return;
      }

      const { contactId } = await res.json();
      console.log('Contact created with ID:', contactId);
      toast({
        title: 'Success',
        description: (
          <>
            <CheckCircle className="mr-2 inline-block text-green-500" /> Contact
            created successfully
          </>
        )
      });
      router.push('/dashboard/contacts');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: (
          <>
            <XCircle className="mr-2 inline-block text-red-500" /> Failed to
            create contact
          </>
        )
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full w-full">
      <div className="flex-1 space-y-6 p-4 sm:p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={`Create New Contact`}
            description="Enter the details of the contact you want to create."
          />
          {!loading && (
            <Link
              href={'/dashboard/contacts'}
              className={cn(buttonVariants({ variant: 'default' }))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          )}
        </div>
        <div className="no-scrollbar max-h-[80vh] overflow-y-auto rounded-lg pb-20">
          <Card className="w-full rounded-lg">
            <CardHeader>
              <CardTitle className="text-left text-2xl font-bold">
                {/* Create New Contact */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Title
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="text-sm sm:text-base"
                              placeholder="Enter title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="text-sm sm:text-base"
                              placeholder="Enter full name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="text-sm sm:text-base"
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Phone
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="text-sm sm:text-base"
                              placeholder="Enter phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="text-sm sm:text-base"
                              placeholder="Enter address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">
                            Organization
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="text-sm sm:text-base"
                              placeholder="Enter organization name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2" // Adjust padding to make it smaller
                  >
                    {loading ? <Spinner /> : 'Create Contact'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
