/** Username <-> synthetic login-email mapping.
 * Supabase Auth needs an email identifier, so usernames are stored as
 * `username@varnika.local` in auth.users. Staff only ever see the username. */

export const AUTH_MAIL_DOMAIN = "varnika.local";

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

export function toLoginEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_MAIL_DOMAIN}`;
}

export function usernameFromEmail(email: string): string {
  const suffix = `@${AUTH_MAIL_DOMAIN}`;
  if (email.toLowerCase().endsWith(suffix)) {
    return email.slice(0, -suffix.length);
  }
  return "";
}
