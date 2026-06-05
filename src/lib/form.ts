import z from 'zod';

const passwordSchema = z.string()
.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
.regex(/[0-9]/, 'Password must contain at least one number')
.min(8, 'Password must be at least 8 characters long')
.regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g. !@#$%)');

export const loginFormSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Please enter your password'),
});

export const signupFormSchema = z
  .object({
    email: z.email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
