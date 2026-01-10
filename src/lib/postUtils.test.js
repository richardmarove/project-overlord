import { describe, it, expect } from 'vitest';
import { generateSlug } from './postUtils';
import { vi } from 'vitest';

vi.mock('./supabase'); // automatically loads the mock file in src/lib/__mocks__/supabase.ts

describe('generateSlug', () => {
    it('should convert title to lowercase', () => {
        expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
        expect(generateSlug('Hello World Test')).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
        expect(generateSlug('Hello @ World!')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
        expect(generateSlug('Hello    World')).toBe('hello-world');
    });

    it('should trim leading and trailing spaces', () => {
        expect(generateSlug('  Hello World  ')).toBe('hello-world');
    });

    it('should handle empty strings', () => {
        expect(generateSlug('')).toBe('');
    });

    it('should handle null/undefined', () => {
        expect(generateSlug(null)).toBe('');
        expect(generateSlug(undefined)).toBe('');
    });

    it('should handle hyphens correctly', () => {
        expect(generateSlug('Start - End')).toBe('start-end');
        expect(generateSlug('Double--Hyphen')).toBe('double-hyphen');
    });
});
