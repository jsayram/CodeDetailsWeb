/**
 * TypeScript interface for Clerk user data
 * Used for webhook payloads and Clerk's User type from clerkClient
 */
export interface ClerkUserData {
  id: string; // or user_id? confirm
  email_addresses?: {
    email_address: string;
  }[];
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  username?: string | null;
  profile_image_url?: string;
  public_metadata?: {
    role?: string;
    tier?: string;
  };
}
