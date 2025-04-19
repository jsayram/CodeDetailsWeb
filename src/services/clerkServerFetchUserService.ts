import { ClerkUserData } from "@/types/models/clerkUserData";
import { API_ROUTES } from "@/constants/api-routes";

// Check for server-side secret key
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error(
    "Clerk Secret API Key is not set. Add it to your server environment variables."
  );
}

const CLERK_API_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_BASE = process.env.CLERK_BACK_API_URL;

/**
 * Server-side function to fetch user data from Clerk API using API key
 * @param userId - The Clerk user ID to fetch
 * @returns Object containing either the user data or an error
 */
export async function fetchClerkUser(
  userId: string
): Promise<{ data: ClerkUserData | null; error: Error | null }> {
  try {
    if (!CLERK_API_KEY) {
      throw new Error("CLERK_API_KEY environment variable is not set");
    }

    // Use fetch with the Clerk API directly using centralized API routes
    const response = await fetch(
      `${CLERK_API_BASE}${API_ROUTES.AUTH.USER(userId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CLERK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clerk API error (${response.status}): ${errorText}`);
    }

    const user = await response.json();

    if (!user) {
      return {
        data: null,
        error: new Error(`User with ID ${userId} not found`),
      };
    }

    // Transform the Clerk user data to match our ClerkUserData interface
    const userData: ClerkUserData = {
      id: user.id,
      email_addresses: user.email_addresses?.map(
        (email: { email_address: string }) => ({
          email_address: email.email_address,
        })
      ),
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      public_metadata: user.public_metadata as { role?: string; tier?: string },
    };

    return { data: userData, error: null };
  } catch (error) {
    console.error(`Error fetching Clerk user ${userId}:`, error);
    const err =
      error instanceof Error
        ? error
        : new Error("Unknown error fetching Clerk user");
    return { data: null, error: err };
  }
}
