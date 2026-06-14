import * as z from 'zod';

export const customerOnboardingSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid international phone number"),
  dateOfBirth: z.string().refine((date) => {
    const age = (new Date().getTime() - new Date(date).getTime()) / 31557600000;
    return age >= 18;
  }, { message: "Customer must be at least 18 years old" }),
  taxId: z.string().min(9, "Valid Tax ID/SSN required"),
  address: z.string().min(10, "Full residential address required"),
});

export type CustomerOnboardingFormValues = z.infer<typeof customerOnboardingSchema>;