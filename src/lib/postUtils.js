import { supabase } from './supabase';

/**
 * Post Utilities
 * Helper functions for post CRUD operations and utilities
 */

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The post title
 * @returns {string} - URL-friendly slug
 */
export function generateSlug(title) {
    if (!title) return '';

    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Check if a slug is unique in the database
 * @param {string} slug - The slug to check
 * @param {string} excludeId - Optional post ID to exclude (for updates)
 * @returns {Promise<boolean>} - True if slug is unique
 */
export async function isSlugUnique(slug, excludeId = null) {
    let query = supabase
        .from('posts')
        .select('id')
        .eq('slug', slug);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error checking slug uniqueness:', error);
        return false;
    }

    return data.length === 0;
}

/**
 * Create a new post
 * @param {object} postData - The post data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createPost(postData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([{
                ...postData,
                author_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error creating post:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update an existing post
 * @param {string} id - The post ID
 * @param {object} postData - The updated post data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updatePost(id, postData) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .update({
                ...postData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating post:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error updating post:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get a post by ID
 * @param {string} id - The post ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getPostById(id) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching post:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload a cover image to Supabase Storage
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadCoverImage(file) {
    try {
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return { success: false, error: uploadError.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a cover image from Supabase Storage
 * @param {string} url - The public URL of the image
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCoverImage(url) {
    try {
        // Extract file path from URL
        const urlParts = url.split('/images/');
        if (urlParts.length < 2) {
            return { success: false, error: 'Invalid image URL' };
        }

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('images')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        return { success: false, error: error.message };
    }
}
