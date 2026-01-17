import { useState, useEffect } from 'react';
import { getPosts, deletePost } from '../lib/postUtils';
import { formatTimeAgo } from '../lib/dashboardUtils';
import { Pencil, Trash2, Plus, Calendar } from 'lucide-react';

export default function PostList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        loadPosts();
    }, []);

    async function loadPosts() {
        try {
            const { success, data } = await getPosts();
            if (success) {
                setPosts(data || []);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id, e) => {
        e.preventDefault(); // Prevent navigation if button is inside a link (though here we'll structure it safely)
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        setDeletingId(id);
        const { success } = await deletePost(id);
        if (success) {
            setPosts(posts.filter(post => post.id !== id));
        }
        setDeletingId(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-white/20 border-t-white rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white lexend-font">All Posts</h2>
                <a
                    href="/admin/posts/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Post</span>
                </a>
            </div>

            <div className="grid gap-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-white/5">
                        <p className="text-zinc-400">No posts found. Create your first one!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div
                            key={post.id}
                            className="group relative p-4 bg-zinc-900/50 hover:bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-xl transition-all duration-300"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${post.published
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            {post.published ? 'Published' : 'Draft'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatTimeAgo(post.updated_at)}
                                        </span>
                                    </div>
                                    {post.description && (
                                        <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{post.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/admin/posts/edit/${post.id}`}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Edit Post"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={(e) => handleDelete(post.id, e)}
                                        disabled={deletingId === post.id}
                                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                        title="Delete Post"
                                    >
                                        {deletingId === post.id ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
