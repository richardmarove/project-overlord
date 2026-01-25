import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatActivityAction, formatTimeAgo, getActivityIcon } from '../lib/dashboardUtils';
import StatCard from './StatCard';
import {
  Settings2,
  ChartSpline,
  UsersRound,
  Baby,
  Check,
  NotebookPen,
  User,
  BellRing,
  Search,
  FileCog,
} from 'lucide-react';

export default function DashboardContent({
  user,
  profile,
  activities = [],
  totalPosts = 0,
  totalUsers = 0,
  recentLogins = 0,
  apiResponseTime = '0 ms',
  apiResponseTrend,
  apiResponseTrendValue,
}) {
  const [signingOut, setSigningOut] = useState(false);

  // We no longer need internal state for data since it comes from props
  // and we no longer need the useEffect to load data

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      setSigningOut(false);
    }
  };

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
        <p className="text-lg text-zinc-400">{user.email}</p>
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
          title="Recent Logins (24h)"
          value={recentLogins}
          icon={<Baby className="w-5 h-5" />}
          trend="down"
          trendValue="0%"
        />
        <StatCard
          title="API Response Time"
          value={apiResponseTime}
          icon={<Check className="w-5 h-5" />}
          trend={apiResponseTrend}
          trendValue={apiResponseTrendValue}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 lexend-font">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: <NotebookPen className="w-6 h-6" />,
                label: 'New Post',
                color: 'from-blue-500/20 to-blue-600/20',
                href: '/admin/posts/new',
              },
              {
                icon: <User className="w-7 h-7" />,
                label: 'Users',
                color: 'from-purple-500/20 to-purple-600/20',
                href: '#',
              },
              {
                icon: <Settings2 className="w-7 h-7" />,
                label: 'Settings',
                color: 'from-zinc-500/20 to-zinc-600/20',
                href: '#',
              },
              {
                icon: <FileCog className="w-7 h-7" />,
                label: 'Edit Post',
                color: 'from-orange-500/20 to-orange-600/20',
                href: '/admin/posts',
              },
              {
                icon: <BellRing className="w-7 h-7" />,
                label: 'Notifications',
                color: 'from-yellow-500/20 to-yellow-600/20',
                href: '#',
              },
              {
                icon: <Search className="w-7 h-7" />,
                label: 'Recent Activity',
                color: 'from-red-500/20 to-red-600/20',
                href: '/admin/activity',
              },
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
          <h2 className="text-2xl font-bold text-white mb-6 lexend-font">Recent Activity</h2>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl">
                    {(() => {
                      const Icon = getActivityIcon(activity.action);
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{formatActivityAction(activity)}</p>
                    <p className="text-xs text-zinc-500">{formatTimeAgo(activity.created_at)}</p>
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
