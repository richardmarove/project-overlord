import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatActivityAction, formatTimeAgo } from '../lib/dashboardUtils';
import StatCard from './StatCard';
import {
    LockOpen, Lock, ScrollText, PencilLine, Trash2, Settings2,
    File, ClipboardList, ChartSpline, UsersRound, Baby, Check,
    NotebookPen, User, BellRing, Search
} from 'lucide-react';

export default function DashboardContent() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [activities, setActivities] = useState([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        async function loadUserData() {
            try {
                // Get current user session
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    // Fetch admin profile
                    const { data: profileData, error: profileError } = await supabase
                        .from('admin_profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                    } else {
                        setProfile(profileData);
                    }

                    // Fetch recent activity logs
                    const { data: activityData, error: activityError } = await supabase
                        .from('activity_logs')
                        .select('*')
                        .eq('user_id', currentUser.id)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (activityError) {
                        console.error('Error fetching activities:', activityError);
                    } else {
                        setActivities(activityData || []);
                    }

                    // Fetch total posts count
                    const { count: postsCount, error: postsCountError } = await supabase
                        .from('posts')
                        .select('*', { count: 'exact', head: true });

                    if (!postsCountError) {
                        setTotalPosts(postsCount || 0);
                    } else {
                        console.error('Error fetching posts count:', postsCountError);
                    }

                    // Fetch total admin users count
                    const { count: usersCount, error: usersCountError } = await supabase
                        .from('admin_profiles')
                        .select('*', { count: 'exact', head: true });

                    if (!usersCountError) {
                        setTotalUsers(usersCount || 0);
                    } else {
                        console.error('Error fetching users count:', usersCountError);
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadUserData();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            // Log the logout activity before signing out
            try {
                const { logLogout } = await import('../lib/activityLogger.js');
                await logLogout();
            } catch (logError) {
                console.error('Error logging logout:', logError);
            }

            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error signing out:', error);
            setSigningOut(false);
        }
    };

    // Helper function to get icon for activity
    const getActivityIcon = (action) => {
        const iconMap = {
            'user_login': <LockOpen className="w-5 h-5" />,
            'user_logout': <Lock className="w-5 h-5" />,
            'post_created': <ScrollText className="w-5 h-5" />,
            'post_updated': <PencilLine className="w-5 h-5" />,
            'post_deleted': <Trash2 className="w-5 h-5" />,
            'settings_updated': <Settings2 className="w-5 h-5" />,
            'file_uploaded': <File className="w-5 h-5" />,
        };
        return iconMap[action] || <ClipboardList className="w-5 h-5" />;
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-12 w-12 border-4 border-white/20 border-t-white rounded-full"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-400">Please log in to access the dashboard.</p>
                <a
                    href="/login"
                    className="mt-4 inline-block px-6 py-2 bg-white text-zinc-950 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
                >
                    Go to Login
                </a>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Welcome Header */}
            <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-white lexend-font">
                    Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}!
                </h1>
                <p className="text-lg text-zinc-400">
                    {user.email}
                </p>
                {profile?.role && (
                    <p className="text-sm text-zinc-500">
                        Role: <span className="text-zinc-400 capitalize">{profile.role}</span>
                    </p>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Posts"
                    value={totalPosts}
                    icon={<ChartSpline className="w-5 h-5" />}
                    trend="up"
                    trendValue="0%"
                />
                <StatCard
                    title="Total Users"
                    value={totalUsers}
                    icon={<UsersRound className="w-5 h-5" />}
                    trend="up"
                    trendValue="0.1%"
                />
                <StatCard
                    title="Recent Logins"
                    value={0}
                    icon={<Baby className="w-5 h-5" />}
                    trend="down"
                    trendValue="0%"
                />
                <StatCard
                    title="API Response Time"
                    value={"123 ms"}
                    icon={<Check className="w-5 h-5" />}
                    trend="up"
                    trendValue="0.3%"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-2 p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 lexend-font">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: <NotebookPen className="w-6 h-6" />, label: 'New Post', color: 'from-blue-500/20 to-blue-600/20', href: '/admin/posts/new' },
                            { icon: <User className="w-7 h-7" />, label: 'Users', color: 'from-purple-500/20 to-purple-600/20', href: '#' },
                            { icon: <Settings2 className="w-7 h-7" />, label: 'Settings', color: 'from-zinc-500/20 to-zinc-600/20', href: '#' },
                            { icon: <ChartSpline className='w-7 h-7' />, label: 'Analytics', color: 'from-green-500/20 to-green-600/20', href: '#' },
                            { icon: <BellRing className='w-7 h-7' />, label: 'Notifications', color: 'from-yellow-500/20 to-yellow-600/20', href: '#' },
                            { icon: <Search className='w-7 h-7' />, label: 'Recent Activity', color: 'from-red-500/20 to-red-600/20', href: '/admin/activity' },
                        ].map((action, index) => (
                            <a
                                key={index}
                                href={action.href}
                                className={`group relative p-6 bg-gradient-to-br ${action.color} backdrop-blur-sm border border-white/10 rounded-xl hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 flex flex-col items-center justify-center`}
                            >
                                <div className="text-3xl mb-2">{action.icon}</div>
                                <div className="text-sm font-medium text-white">{action.label}</div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 lexend-font">
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {activities.length > 0 ? (
                            activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <span className="text-xl">{getActivityIcon(activity.action)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">
                                            {formatActivityAction(activity)}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {formatTimeAgo(activity.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-zinc-500">
                                <p className="text-sm">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sign Out Button */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="px-8 py-3 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg font-semibold hover:bg-red-600/30 hover:border-red-600/50 focus:outline-none focus:ring-2 focus:ring-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
            </div>
        </div>
    );
}
