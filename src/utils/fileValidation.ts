const MIN_FILE_SIZE = 1024; // 1KB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Validate a receipt file before upload
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
export function validateReceiptFile(file: File): string | null {
    // Check minimum file size
    if (file.size < MIN_FILE_SIZE) {
        return 'File is too small. Please upload a valid receipt image.';
    }

    // Check maximum file size
    if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        return `File too large. Maximum size is 5MB. Your file is ${fileSizeMB}MB.`;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        return `Invalid file type. Please upload JPEG or PNG images only.`;
    }

    return null;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }
}
