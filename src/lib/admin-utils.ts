/**
 * Admin utilities for checking user permissions
 * 
 * Current implementation: Email-based check against environment variable
 * Future enhancement: Support Clerk Organizations/Roles
 */

/**
 * Check if a user is an admin based on their email address
 * @param userEmail - The email address to check
 * @returns true if the user is an admin, false otherwise
 */
export function isAdmin(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false;
  
  const adminEmail = process.env.ADMIN_DASHBOARD_MODERATOR;
  if (!adminEmail) {
    console.warn('ADMIN_DASHBOARD_MODERATOR environment variable not set');
    return false;
  }
  
  return userEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim();
}

/**
 * Server-side guard to require admin access
 * Throws an error if the user is not an admin
 * @param userEmail - The email address to check
 * @throws Error if user is not an admin
 */
export function requireAdmin(userEmail: string | null | undefined): void {
  if (!isAdmin(userEmail)) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Future enhancement placeholder for Clerk organization-based admin check
 * @param clerkUser - Clerk user object with organization information
 * @returns true if user has admin role in organization
 */
// export function isAdminByOrg(clerkUser: any): boolean {
//   return clerkUser?.organizationRole === 'admin';
// }
