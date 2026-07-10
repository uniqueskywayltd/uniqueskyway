import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/\d/, "Password must include a number");

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(100, "Name is too long"),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(24, "Username is too long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    email: z.string().trim().email("Enter a valid email address").max(255),
    password: passwordSchema,
    confirmPassword: z.string(),
    referralCode: z.string().trim().max(50).optional(),
    termsAccepted: z.literal(true, {
      error: "You must accept the terms and conditions",
    }),
    mathA: z.number().int().min(1).max(9),
    mathB: z.number().int().min(1).max(9),
    mathAnswer: z.coerce.number().int(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.mathA + data.mathB === data.mathAnswer, {
    message: "Incorrect answer",
    path: ["mathAnswer"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const adminCreateCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name is required")
    .max(100, "Name is too long"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username is too long")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: passwordSchema,
  referralCode: z.string().trim().max(50).optional(),
  emailVerified: z.boolean().optional().default(true),
});

export type AdminCreateCustomerInput = z.infer<typeof adminCreateCustomerSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function generateReferralCode(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}
