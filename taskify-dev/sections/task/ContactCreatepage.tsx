"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Trash } from "lucide-react";

// Define the form schema using Zod
const contactSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  emails: z.array(
    z.object({
      email: z.string().email({ message: "Please provide a valid email." })
    })
  ).min(1, { message: "Please provide at least one email." }),
  phones: z.array(
    z.object({
      phone: z.string().min(10, { message: "Phone number must be at least 10 characters." })
    })
  ).min(1, { message: "Please provide at least one phone number." }),
  address: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional()
});

export default function CreateContactForm() {
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      emails: [{ email: "" }],
      phones: [{ phone: "" }],
      address: "",
      organization: "",
      title: ""
    }
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: "emails"
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    name: "phones"
  });

  const [loading, setLoading] = React.useState(false);

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    setLoading(true);
    try {
      const response = await fetch('/api/addressbook/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create contact');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Contact created successfully!",
      });
      // Reset the form if needed
      form.reset();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the contact.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full w-full">
      <div className="flex-1 space-y-6 p-4 sm:p-8">
        <div className="flex items-start justify-between">
          <h2>Create New Contact</h2>
        </div>
        <div className="no-scrollbar max-h-[80vh] overflow-y-auto rounded-lg pb-20">
          <Card className="w-full rounded-lg">
            <CardHeader>
              <CardTitle className="text-left text-2xl font-bold">Create New Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dynamic Emails */}
                  <div>
                    <FormLabel>Emails</FormLabel>
                    {emailFields.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name={`emails.${index}.email`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input {...field} placeholder="Enter email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeEmail(index)}
                          className="self-start"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendEmail({ email: "" })}
                      className="mt-2"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Email
                    </Button>
                  </div>

                  {/* Dynamic Phones */}
                  <div>
                    <FormLabel>Phone Numbers</FormLabel>
                    {phoneFields.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name={`phones.${index}.phone`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input {...field} placeholder="Enter phone number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removePhone(index)}
                          className="self-start"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendPhone({ phone: "" })}
                      className="mt-2"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Phone
                    </Button>
                  </div>

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Organization */}
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter organization" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading || !form.formState.isValid}>
                    {loading ? "Submitting..." : "Create Contact"}
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
