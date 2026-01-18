import { vi } from 'vitest';

export const supabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
      single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'mock-user-id' } }, error: null })),
    getSession: vi.fn(() =>
      Promise.resolve({ data: { session: { user: { id: 'mock-user-id' } } }, error: null })
    ),
    refreshSession: vi.fn(() =>
      Promise.resolve({ data: { user: { id: 'mock-user-id' }, session: {} }, error: null })
    ),
    signInWithPassword: vi.fn(() =>
      Promise.resolve({ data: { session: { access_token: 'a', refresh_token: 'b' } }, error: null })
    ),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    setSession: vi.fn(() => Promise.resolve({ error: null })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock-url.com/image.jpg' } })),
    })),
  },
};
