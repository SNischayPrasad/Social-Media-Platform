import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or fewer")
    .regex(/^[a-z0-9_]+$/i, "Letters, numbers and underscores only"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  displayName: z.string().min(1, "Display name is required").max(50),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(280).nullish(),
  avatarUrl: z.string().url("Avatar must be a valid URL").nullish().or(z.literal("")),
});

export const createPostSchema = z
  .object({
    content: z.string().max(500, "Posts are limited to 500 characters").default(""),
    mediaUrl: z.string().url("Media must be a valid URL").nullish().or(z.literal("")),
    mediaType: z.enum(["IMAGE", "VIDEO"]).nullish(),
  })
  .refine((data) => data.content.trim().length > 0 || !!data.mediaUrl, {
    message: "A post needs text or a media link",
    path: ["content"],
  });

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(300),
});

/** Flattens a ZodError into { field: message } for the API response. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.errors) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
