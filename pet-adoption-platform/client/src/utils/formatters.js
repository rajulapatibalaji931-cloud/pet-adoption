const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const resolveMediaUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${BACKEND_ORIGIN}${url}`;
  return `${BACKEND_ORIGIN}/${url}`;
};

export const formatAge = (ageYears) => {
  if (ageYears === undefined || ageYears === null) return 'Unknown';
  if (ageYears < 1) {
    const months = Math.max(1, Math.round(ageYears * 12));
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  const rounded = Number(ageYears.toFixed(1));
  return `${rounded} ${rounded === 1 ? 'yr' : 'yrs'}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const statusBadgeClasses = (status) => {
  switch (status) {
    case 'Verified':
    case 'Available':
    case 'Approved':
    case 'Completed':
    case 'Healthy':
    case 'Resolved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Pending':
    case 'Under Review':
    case 'Requires Manual Review':
    case 'Recovering':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Rejected':
    case 'Cancelled':
    case 'Unavailable':
    case 'Unverified':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Adopted':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};
