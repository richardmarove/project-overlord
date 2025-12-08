import { supabase } from './supabase';

/**
 * Activity Logger Utility
 * Provides functions to log user activities to the activity_logs table
 */

/**
 * Main function to log an activity
 * @param {string} action - The action being logged (e.g., 'user_login', 'post_created')
 * @param {string} resourceType - Type of resource affected (e.g., 'post', 'user', 'setting')
 * @param {string} resourceId - UUID of the affected resource
 * @param {object} metadata - Additional data about the activity
 */
export async function logActivity(action, resourceType = null, resourceId = null, metadata = null) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('Cannot log activity: User not authenticated');
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('activity_logs')
            .insert([
                {
                    user_id: user.id,
                    action,
                    resource_type: resourceType,
                    resource_id: resourceId,
                    metadata,
                }
            ])
            .select();

        if (error) {
            console.error('Error logging activity:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error logging activity:', error);
        return { success: false, error };
    }
}

/**
 * Helper function to log user login
 */
export async function logLogin() {
    return await logActivity('user_login', 'auth', null, {
        timestamp: new Date().toISOString(),
        event: 'login_success'
    });
}

/**
 * Helper function to log user logout
 */
export async function logLogout() {
    return await logActivity('user_logout', 'auth', null, {
        timestamp: new Date().toISOString(),
        event: 'logout'
    });
}

/**
 * Helper function to update last login timestamp in admin profile
 */
export async function updateLastLogin() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false };

        const { error } = await supabase
            .from('admin_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating last login:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating last login:', error);
        return { success: false, error };
    }
}

/**
 * Helper function to log post creation
 */
export async function logPostCreated(postId, postTitle) {
    return await logActivity('post_created', 'post', postId, {
        title: postTitle,
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper function to log post update
 */
export async function logPostUpdated(postId, postTitle) {
    return await logActivity('post_updated', 'post', postId, {
        title: postTitle,
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper function to log post deletion
 */
export async function logPostDeleted(postId, postTitle) {
    return await logActivity('post_deleted', 'post', postId, {
        title: postTitle,
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper function to log settings update
 */
export async function logSettingsUpdated(settingName) {
    return await logActivity('settings_updated', 'setting', null, {
        setting: settingName,
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper function to log file upload
 */
export async function logFileUploaded(filename, filesize) {
    return await logActivity('file_uploaded', 'file', null, {
        filename,
        size_bytes: filesize,
        timestamp: new Date().toISOString()
    });
}
