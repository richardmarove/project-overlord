import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  generateSlug,
  createPost,
  updatePost,
  uploadCoverImage,
  getPostById,
  deletePost,
} from '../lib/postUtils';
import { logPostCreated, logPostUpdated, logPostDeleted } from '../lib/activityLogger';
import { Save, Send, ImagePlus, X, Loader2, Eye, EyeOff, ArrowLeft, FileText, Trash2 } from 'lucide-react';

export default function PostEditor({ postId = undefined }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    published: false,
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewMode, setPreviewMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch post data if editing
  useEffect(() => {
    async function fetchPost() {
      if (!postId) return;

      setLoading(true);
      const result = await getPostById(postId);

      if (result.success && result.data) {
        const data = result.data;
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          cover_image: data.cover_image || '',
          published: data.published || false,
        });
        setOriginalData(data);
        setSlugManuallyEdited(true);
      } else {
        setMessage({ type: 'error', text: 'Failed to load post' });
      }

      setLoading(false);
    }

    fetchPost();
  }, [postId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && formData.title) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.title),
      }));
    }
  }, [formData.title, slugManuallyEdited]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'slug') {
      setSlugManuallyEdited(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setImageUploading(true);
    setMessage({ type: '', text: '' });

    const result = await uploadCoverImage(file);

    if (result.success) {
      setFormData((prev) => ({ ...prev, cover_image: result.url }));
      setMessage({ type: 'success', text: 'Image uploaded successfully' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to upload image' });
    }

    setImageUploading(false);
  };

  const removeCoverImage = () => {
    setFormData((prev) => ({ ...prev, cover_image: '' }));
  };

  const handleSave = async (publish = false) => {
    // Validation
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    if (!formData.slug.trim()) {
      setMessage({ type: 'error', text: 'Slug is required' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    const postData = {
      ...formData,
      published: publish ? true : formData.published,
      // Set published_at when:
      // 1. User clicks Publish AND post wasn't already published
      // 2. Keep existing published_at if already published
      published_at:
        publish || formData.published
          ? originalData?.published_at || new Date().toISOString()
          : null,
    };

    let result;

    if (postId) {
      // Update existing post
      result = await updatePost(postId, postData);
      if (result.success) {
        await logPostUpdated(postId, formData.title);
        setMessage({ type: 'success', text: 'Post updated successfully!' });
      }
    } else {
      // Create new post
      result = await createPost(postData);
      if (result.success) {
        await logPostCreated(result.data.id, formData.title);
        setMessage({ type: 'success', text: 'Post created successfully!' });

        // Redirect based on publish status
        setTimeout(() => {
          if (postData.published) {
            window.location.href = `/posts/${result.data.slug}`;
          } else {
            window.location.href = `/admin/posts/edit/${result.data.id}`;
          }
        }, 1000);
      }
    }

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Failed to save post' });
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!postId) return;

    setDeleting(true);
    setMessage({ type: '', text: '' });

    const result = await deletePost(postId);

    if (result.success) {
      await logPostDeleted(postId, formData.title);
      setMessage({ type: 'success', text: 'Post deleted successfully!' });

      // Redirect to admin dashboard after deletion
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete post' });
      setDeleting(false);
    }

    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <a
            href="/admin"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-3xl font-bold text-white lexend-font">
              {postId ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {postId ? 'Update your post content' : 'Create a new blog post'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg border ${message.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-green-500/10 border-green-500/30 text-green-400'
            }`}
        >
          {message.text}
        </div>
      )}

      {previewMode ? (
        /* Preview Mode */
        <div className="p-8 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
          {formData.cover_image && (
            <img
              src={formData.cover_image}
              alt="Cover"
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
          )}
          <h1 className="text-4xl font-bold text-white mb-4">{formData.title || 'Untitled'}</h1>
          {formData.excerpt && <p className="text-xl text-zinc-400 mb-6">{formData.excerpt}</p>}
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-zinc-300">
              {formData.content || 'No content yet...'}
            </pre>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
            <label className="block text-sm font-medium text-zinc-300 mb-3">Cover Image</label>

            {formData.cover_image ? (
              <div className="relative group">
                <img
                  src={formData.cover_image}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={removeCoverImage}
                  className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-white/40 transition-colors bg-white/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageUploading}
                />
                {imageUploading ? (
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-sm text-zinc-400">Click to upload cover image</span>
                    <span className="text-xs text-zinc-500 mt-1">Max 5MB</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Title & Slug */}
          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter post title..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Slug <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-white/10 border border-white/10 border-r-0 rounded-l-xl text-zinc-400 text-sm">
                  /posts/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="url-friendly-slug"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Auto-generated from title. Edit to customize.
              </p>
            </div>
          </div>

          {/* Excerpt */}
          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Excerpt</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              placeholder="Brief summary of your post..."
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
            />
          </div>

          {/* Content */}
          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-300">Content</label>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Markdown supported
              </span>
            </div>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write your post content here... (Markdown supported)"
              rows={16}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-zinc-300">Published</span>
            </label>

            <div className="flex items-center gap-3">
              {postId && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving || deleting}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}

              <button
                onClick={() => handleSave(false)}
                disabled={saving || deleting}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Draft
              </button>

              <button
                onClick={() => handleSave(true)}
                disabled={saving || deleting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to delete "{formData.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
