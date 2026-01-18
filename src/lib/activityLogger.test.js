import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logActivity,
  logLogin,
  logLogout,
  logPostCreated,
  logPostUpdated,
  logPostDeleted,
  logSettingsUpdated,
  logFileUploaded,
  updateLastLogin,
} from './activityLogger';
import { supabase } from './supabase';

vi.mock('./supabase');

describe('activityLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logActivity', () => {
    it('should log activity successfully when authenticated', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockResult = { data: [{ id: 1 }], error: null };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null });

      const selectMock = vi.fn().mockResolvedValue(mockResult);
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock });

      const result = await logActivity('test_action', 'test_resource', '123', { foo: 'bar' });

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('activity_logs');
      expect(insertMock).toHaveBeenCalledWith([
        {
          user_id: mockUser.id,
          action: 'test_action',
          resource_type: 'test_resource',
          resource_id: '123',
          metadata: { foo: 'bar' },
        },
      ]);
      expect(result).toEqual({ success: true, data: mockResult.data });
    });

    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });

      const result = await logActivity('test_action');

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return error when supabase insert fails', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockError = { message: 'DB Error' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null });

      const selectMock = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock });

      const result = await logActivity('test_action');

      expect(result).toEqual({ success: false, error: mockError });
    });
  });

  describe('helper functions', () => {
    it('logLogin should call logActivity with correct params', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: selectMock }),
      });

      await logLogin();

      expect(supabase.from).toHaveBeenCalledWith('activity_logs');
      // We check that the first argument to insert matches the expected shape
      const insertCall = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0][0];
      expect(insertCall.action).toBe('user_login');
      expect(insertCall.resource_type).toBe('auth');
    });

    it('logPostCreated should include postId and title', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: selectMock }),
      });

      await logPostCreated('p1', 'Test Post');

      const insertCall = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0][0];
      expect(insertCall.action).toBe('post_created');
      expect(insertCall.resource_id).toBe('p1');
      expect(insertCall.metadata.title).toBe('Test Post');
    });

    it('logLogout should call logActivity for auth resource', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: selectMock }),
      });

      await logLogout();

      const insertCall = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0][0];
      expect(insertCall.action).toBe('user_logout');
      expect(insertCall.resource_type).toBe('auth');
    });

    it('logPostUpdated should include postId and new title', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: selectMock }),
      });

      await logPostUpdated('p1', 'Updated Post');

      const insertCall = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0][0];
      expect(insertCall.action).toBe('post_updated');
      expect(insertCall.resource_id).toBe('p1');
      expect(insertCall.metadata.title).toBe('Updated Post');
    });

    it('logPostDeleted should include postId', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: selectMock }),
      });

      await logPostDeleted('p1', 'Deleted Post');

      const insertCall = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0][0];
      expect(insertCall.action).toBe('post_deleted');
      expect(insertCall.resource_id).toBe('p1');
    });

    it('logSettingsUpdated should include setting name', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: selectMock }),
      });

      await logSettingsUpdated('site_title');

      const insertCall = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0][0];
      expect(insertCall.action).toBe('settings_updated');
      expect(insertCall.metadata.setting).toBe('site_title');
    });

    it('logFileUploaded should include filename and size', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: selectMock }),
      });

      await logFileUploaded('image.png', 1024);

      const insertCall = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0][0];
      expect(insertCall.action).toBe('file_uploaded');
      expect(insertCall.metadata.filename).toBe('image.png');
      expect(insertCall.metadata.size_bytes).toBe(1024);
    });
  });

  describe('updateLastLogin', () => {
    it('should update admin profile with current timestamp', async () => {
      const mockUser = { id: 'test-user-id' };
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null });

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      vi.mocked(supabase.from).mockReturnValue({ update: updateMock });

      const result = await updateLastLogin();

      expect(supabase.from).toHaveBeenCalledWith('admin_profiles');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          last_login_at: expect.any(String),
        })
      );
      expect(eqMock).toHaveBeenCalledWith('id', mockUser.id);
      expect(result).toEqual({ success: true });
    });
  });
});
