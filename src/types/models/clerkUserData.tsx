// Define TypeScript Interface for Clerk User Data
// This interface defines the shape of the Clerk user data that is sent to the webhook route.
// This will help us catch any errors in the data structure before runtime.
export interface ClerkUserData {
    id: string; // or user_id? confirm
    email_addresses?: {
      email_address: string;
    }[];
    first_name?: string;
    last_name?: string;
    full_name?: string;
    username?: string;
    public_metadata?: {
      role?: string;
      tier?: string;
    };
  }