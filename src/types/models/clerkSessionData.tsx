// Define TypeScript Interface for Clerk Session Data
// This interface defines the shape of the Clerk session data that is sent to the webhook route.
// This will help us catch any errors in the data structure before runtime.
export interface ClerkSessionData {
    id: string;                 // The unique session identifier
    user_id: string;            // ID of the user this session belongs to
    status: string;             // Status of the session (e.g., "active", "ended")
    created_at: number;         // Unix timestamp when session was created
    expire_at: number;          // Unix timestamp when session expires 
    last_active_at: number;     // Unix timestamp of last activity
    updated_at: number;         // When the session was last updated
    object: string;             // Type of object (e.g., "session")
    client_id: string;          // Client identifier 
    abandon_at: number;         // When session will be abandoned 
  }