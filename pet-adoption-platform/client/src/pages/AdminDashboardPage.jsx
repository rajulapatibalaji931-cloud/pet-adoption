import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  PawPrint,
  CheckCircle2,
  AlertCircle,
  Ban,
  ScrollText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import api, { getErrorMessage } from '../services/api';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

const PIE_COLORS = ['#16a34a', '#ea580c', '#0284c7', '#8b5cf6', '#64748b'];

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('verifications');
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({ speciesBreakdown: [], monthlyAdoptions: [] });
  const [ngos, setNgos] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, ngosRes, usersRes, reportsRes, logsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/ngos'),
        api.get('/admin/users?limit=50'),
        api.get('/admin/reports'),
        api.get('/admin/audit-logs'),
      ]);
      setStats(dashRes.data.stats || {});
      setCharts(dashRes.data.charts || { speciesBreakdown: [], monthlyAdoptions: [] });
      setNgos(ngosRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setReports(reportsRes.data.data || []);
      setAuditLogs(logsRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleVerifyDecision = async (id, status, targetType) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/admin/verification/${id}`, { status, targetType });
      setMessage(data.message);
      loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleSuspend = async (userId, currentSuspended) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/admin/users/${userId}/suspend`, {
        isSuspended: !currentSuspended,
        reason: !currentSuspended ? 'Suspended during platform security review.' : '',
      });
      setMessage(data.message);
      loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleResolveReport = async (reportId, status, unpublishPet = false) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/admin/reports/${reportId}`, {
        status,
        unpublishPet,
      });
      setMessage(data.message);
      loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Platform Administration & Security
        </span>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
          Admin Control Center
        </h1>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.totalUsers || 0, icon: Users },
          { label: 'Registered NGOs', value: stats.totalNgos || 0, icon: Building2 },
          { label: 'Pending NGOs', value: stats.pendingNgos || 0, icon: Building2 },
          { label: 'Total Pets', value: stats.totalPets || 0, icon: PawPrint },
          { label: 'Adoptions', value: stats.totalAdoptions || 0, icon: CheckCircle2 },
          { label: 'Open Reports', value: stats.openReports || 0, icon: ShieldAlert },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {kpi.label}
                </span>
                <Icon className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="font-display text-2xl font-extrabold text-slate-900 mt-2">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-display font-bold text-slate-900 mb-4">Adoption Activity</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyAdoptions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" name="Applications" fill="#ea580c" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-display font-bold text-slate-900 mb-4">Pets by Species</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.speciesBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  label
                >
                  {charts.speciesBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
        {[
          { id: 'verifications', label: `NGO Verifications (${ngos.length})` },
          { id: 'users', label: `Users & Adopter KYC (${users.length})` },
          { id: 'reports', label: `Reported Listings (${reports.length})` },
          { id: 'audit', label: 'Security Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-56 rounded-3xl bg-slate-100 animate-pulse" />
      ) : activeTab === 'verifications' ? (
        <div className="space-y-4">
          {ngos.map((n) => (
            <div
              key={n._id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-slate-900">{n.organizationName}</h3>
                  <StatusBadge status={n.verificationStatus} />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Reg No: <strong>{n.registrationNumber}</strong> • {n.address?.city},{' '}
                  {n.address?.state} • Contact: {n.userId?.email}
                </p>
              </div>
              <div className="flex gap-2">
                {n.verificationStatus !== 'Verified' && (
                  <button
                    type="button"
                    onClick={() => handleVerifyDecision(n._id, 'Verified', 'ngo')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Approve NGO
                  </button>
                )}
                {n.verificationStatus !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => handleVerifyDecision(n._id, 'Rejected', 'ngo')}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'users' ? (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name & Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Verification</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{u.fullName}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5 uppercase text-xs font-bold text-slate-700">{u.role}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={u.verificationStatus} />
                  </td>
                  <td className="px-5 py-3.5">
                    {u.isSuspended ? (
                      <span className="text-xs font-bold text-rose-600">Suspended</span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    {u.role === 'adopter' && u.verificationStatus !== 'Verified' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyDecision(u._id, 'Verified', 'adopter')}
                        className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold cursor-pointer"
                      >
                        Verify KYC
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleToggleSuspend(u._id, u.isSuspended)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        {u.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'reports' ? (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-10 text-center rounded-3xl border border-dashed border-slate-300 text-slate-600 text-sm">
              No reported listings or profiles.
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r._id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="font-bold text-slate-900">{r.reason}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Reported by {r.reporterId?.fullName} • Target:{' '}
                    {r.targetInfo ? `${r.targetInfo.name} (${r.targetInfo.petCode})` : r.targetType}
                  </p>
                  {r.details && <p className="text-sm text-slate-700 mt-2">{r.details}</p>}
                </div>
                {r.status === 'Open' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolveReport(r._id, 'Resolved', true)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Unpublish & Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveReport(r._id, 'Dismissed', false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs font-bold uppercase text-slate-600">
            <ScrollText className="h-4 w-4 text-emerald-600" /> Recent Audit Trail
          </div>
          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log._id} className="px-5 py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-emerald-700">{log.action}</span>
                  <span className="text-slate-600 ml-2">
                    on {log.resourceType} ({log.resourceId || 'system'}) by{' '}
                    {log.userId?.email || 'system'}
                  </span>
                </div>
                <span className="text-slate-400">{formatDate(log.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
