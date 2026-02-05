/**
 * Backend constants for serverless functions
 * Centralized location for shared constants
 */

// ============================================================================
// File Validation Constants
// ============================================================================

/**
 * Supported MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
] as const;

/**
 * Supported file extensions
 */
export const ALLOWED_FILE_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'pdf'
] as const;

// ============================================================================
// Payment Method Constants
// ============================================================================

/**
 * All supported payment methods
 */
export const PAYMENT_METHODS = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'QR Pay',
    'Transfer'
] as const;

/**
 * Default payment method
 */
export const DEFAULT_PAYMENT_METHOD = 'Cash';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map file extension to MIME type
 */
export function getMimeTypeFromExtension(extension: string): string | null {
    const ext = extension.toLowerCase().replace('.', '');
    const mimeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'pdf': 'application/pdf'
    };
    return mimeMap[ext] || null;
}

/**
 * Map MIME type to preferred file extension
 */
export function getExtensionFromMimeType(mimeType: string): string {
    const extensionMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'application/pdf': 'pdf'
    };
    return extensionMap[mimeType] || 'jpg';
}

// ============================================================================
// Type Exports
// ============================================================================

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];
export type AllowedFileExtension = typeof ALLOWED_FILE_EXTENSIONS[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
