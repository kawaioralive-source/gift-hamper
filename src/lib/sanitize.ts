/**
 * Security and Data Sanitization Utilities
 * Protects platform text inputs against XSS, script injection, and invalid character sequences.
 */

export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Strip HTML brackets to prevent tag injection
    .replace(/javascript:/gi, '') // Remove javascript pseudo-protocol
    .replace(/on\w+=/gi, '') // Remove inline event handlers like onclick=
    .trim();
}

export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim().slice(0, 255);
}

export function sanitizeFileName(fileName: string): string {
  // Allow only alphanumeric characters, dashes, and standard extension
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  // Prevent directory traversal
  return cleanName.replace(/\.{2,}/g, '.');
}

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

export function isValidImageUpload(mimeType: string, extension: string, sizeBytes: number): boolean {
  if (!ALLOWED_IMAGE_TYPES.has(mimeType.toLowerCase())) return false;
  if (!ALLOWED_EXTENSIONS.has(extension.toLowerCase())) return false;
  if (sizeBytes <= 0 || sizeBytes > 5 * 1024 * 1024) return false; // Max 5MB
  return true;
}
