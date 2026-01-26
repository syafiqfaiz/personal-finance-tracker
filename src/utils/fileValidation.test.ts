import { describe, it, expect } from 'vitest';
import { validateReceiptFile, formatFileSize } from './fileValidation';

describe('validateReceiptFile', () => {
    it('should accept valid JPEG file under 5MB', () => {
        const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

        const error = validateReceiptFile(file);
        expect(error).toBeNull();
    });

    it('should accept valid PNG file under 5MB', () => {
        const file = new File(['test'], 'receipt.png', { type: 'image/png' });
        Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB

        const error = validateReceiptFile(file);
        expect(error).toBeNull();
    });

    it('should reject file over 5MB', () => {
        const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

        const error = validateReceiptFile(file);
        expect(error).toContain('File too large');
        expect(error).toContain('6.00MB');
    });

    it('should reject file under 1KB (minimum size)', () => {
        const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 512 }); // 512 bytes

        const error = validateReceiptFile(file);
        expect(error).toContain('File is too small');
        expect(error).toContain('valid receipt image');
    });

    it('should accept file exactly at 1KB minimum', () => {
        const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 }); // Exactly 1KB

        const error = validateReceiptFile(file);
        expect(error).toBeNull();
    });

    it('should reject invalid file type (PDF)', () => {
        const file = new File(['test'], 'receipt.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

        const error = validateReceiptFile(file);
        expect(error).toContain('Invalid file type');
        expect(error).toContain('JPEG or PNG');
    });

    it('should reject invalid file type (HEIC)', () => {
        const file = new File(['test'], 'receipt.heic', { type: 'image/heic' });
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

        const error = validateReceiptFile(file);
        expect(error).toContain('Invalid file type');
    });

    it('should handle case-insensitive file types', () => {
        const file = new File(['test'], 'receipt.JPG', { type: 'image/JPEG' });
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

        const error = validateReceiptFile(file);
        expect(error).toBeNull();
    });
});

describe('formatFileSize', () => {
    it('should format bytes', () => {
        expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
        expect(formatFileSize(1024)).toBe('1.00 KB');
        expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('should format megabytes', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
        expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
    });
});
