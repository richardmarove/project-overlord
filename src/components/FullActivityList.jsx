import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatActivityAction, formatTimeAgo, getActivityIcon } from '../lib/dashboardUtils';
import { ArrowLeft } from 'lucide-react';

export default function FullActivityList() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (currentUser) {
          const { data: activityData, error: activityError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50); // Activity logs limited to 50

          if (activityError) {
            console.error('Error fetching activities:', activityError);
          } else {
            setActivities(activityData || []);
          }
        }
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <a href="/admin" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
          <ArrowLeft className="w-6 h-6" />
        </a>
        <h1 className="text-3xl font-bold text-white lexend-font">Activity Log</h1>
      </div>

      <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-white/20 border-t-white rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                >
                  <span className="text-xl mt-1 text-zinc-400">
                    {(() => {
                      const Icon = getActivityIcon(activity.action);
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-white font-medium">
                      {formatActivityAction(activity)}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs text-zinc-500 whitespace-nowrap">
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <p>No activity found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
