import { describe, it, expect } from 'vitest';
import { formatActivityAction, formatTimeAgo } from './dashboardUtils';

// We dont vi.mock('./supabase') supabase here because src/lib/dashboardUtils.js doesn't import it

describe('formatActivityAction', () => {
  it('should return correct string for known actions', () => {
    expect(formatActivityAction({ action: 'user_login' })).toBe('Logged in');
    expect(formatActivityAction({ action: 'post_created' })).toBe('Created post');
    expect(formatActivityAction({ action: 'file_uploaded' })).toBe('Uploaded file');
  });

  it('should return action string for unknown actions', () => {
    expect(formatActivityAction({ action: 'unknown_action' })).toBe('unknown_action');
  });
});

describe('formatTimeAgo', () => {
  it('should return "just now" for less than 60 seconds', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatTimeAgo(date)).toBe('just now');
  });

  it('should return minutes ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(date)).toBe('5 min ago');
  });

  it('should return hours ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(date)).toBe('2 hours ago');
  });

  it('should return days ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(date)).toBe('3 days ago');
  });

  it('should return date string for more than 7 days', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    // compare the date string format
    expect(formatTimeAgo(date.toISOString())).toBe(date.toLocaleDateString());
  });
});
