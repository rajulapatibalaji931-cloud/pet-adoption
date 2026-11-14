import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, CheckCircle2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

const NotificationCenterPage = () => {
  const { setUnreadNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter === 'unread' ? '?unreadOnly=true' : '';
      const { data } = await api.get(`/notifications${query}`);
      setNotifications(data.data || []);
      setUnreadNotifications(data.unreadCount || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter, setUnreadNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-emerald-600" />
            Notification Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Adoption updates, verification alerts, and scheduled care reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              filter === 'unread'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Unread Only
          </button>
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600" /> Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 text-rose-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 bg-slate-50">
          <Bell className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-800">No notifications to display</p>
          <p className="text-xs text-slate-500 mt-1">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.readStatus
                  ? 'bg-white border-slate-200'
                  : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {n.notificationType}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(n.createdAt)}</span>
                  {!n.readStatus && (
                    <span className="h-2 w-2 rounded-full bg-orange-600" aria-label="Unread" />
                  )}
                </div>
                <h2 className="font-bold text-slate-900">{n.title}</h2>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
              </div>
              {!n.readStatus && (
                <button
                  type="button"
                  onClick={() => markRead(n._id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-emerald-50 text-xs font-semibold text-emerald-700 shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenterPage;
