/**
 * Converts a string to a URL-friendly slug
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
};

/**
 * Extracts initials from a name, email, or username
 * @param name The input string to extract initials from
 * @returns A string of up to 2 uppercase initials
 */
export const getInitials = (name: string): string => {
  if (!name) return "";
  
  // Remove @ and everything after if it's an email
  const cleanName = name.split("@")[0];
  
  // Split by common separators (space, dot, underscore, dash)
  const parts = cleanName.split(/[\s._-]+/).filter(Boolean);
  
  if (parts.length === 0) return cleanName.substring(0, 2).toUpperCase();
  
  return parts
    .slice(0, 2)
    .map(part => part[0] || "")
    .join("")
    .toUpperCase();
};

/**
 * Capitalizes the first letter of each name part in a full name
 * @param fullName The full name to capitalize
 * @returns The capitalized full name
 */
export function capitalizeNames(fullName: string): string {
  // Split the name into parts
  const names = fullName.trim().split(/\s+/);
  
  // If empty string or single word, just capitalize first letter
  if (names.length <= 1) {
      return names[0]?.charAt(0).toUpperCase() + names[0]?.slice(1).toLowerCase() || '';
  }
  
  // Get first and last names
  const firstName = names[0];
  const lastName = names[names.length - 1];
  
  // Capitalize first letters
  const capitalizedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const capitalizedLast = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
  
  // Handle middle names if any
  const middleNames = names.slice(1, -1).map(name => 
      name.toLowerCase()
  ).join(' ');
  
  return middleNames 
      ? `${capitalizedFirst} ${middleNames} ${capitalizedLast}`
      : `${capitalizedFirst} ${capitalizedLast}`;
}