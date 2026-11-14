import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck2,
  Heart,
  CalendarClock,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, resolveMediaUrl } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

const AdopterDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);
  const [careSchedules, setCareSchedules] = useState([]);
  const [adoptedPets, setAdoptedPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Verification Form State
  const [verifyForm, setVerifyForm] = useState({
    fullName: user?.fullName || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    idType: 'Aadhaar / National ID',
    idNumber: '',
    address: user?.address?.street
      ? `${user.address.street}, ${user.address.city || ''}`
      : '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [addressProofFile, setAddressProofFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  useEffect(() => {
    if (user) {
      setVerifyForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        dateOfBirth:
          prev.dateOfBirth || (user.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : ''),
        address:
          prev.address ||
          (user.address?.street
            ? `${user.address.street}${user.address.city ? `, ${user.address.city}` : ''}`
            : user.address?.city || ''),
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
  });

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [reqRes, careRes] = await Promise.all([
        api.get('/adoptions/my-requests'),
        api.get('/care/my-schedules'),
      ]);
      setRequests(reqRes.data.data || []);
      setCareSchedules(careRes.data.data || []);
      setAdoptedPets(careRes.data.adoptedPets || []);
    } catch (err) {
      if (!silent) setError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  useEffect(() => {
    const handleFocus = () => {
      if (activeTab !== 'verification') {
        loadDashboard(true);
        refreshUser();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab, loadDashboard, refreshUser]);

  const handleCancelRequest = async (id) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.post(`/adoptions/${id}/cancel`);
      setMessage(data.message);
      loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setVerifyError('');
    setVerifySuccess('');

    if (!addressProofFile && !user?.verificationMetadata?.addressProofUrl) {
      setVerifyError('Please upload your ID / Address Proof file (PNG, JPG, WebP, or PDF).');
      return;
    }

    setVerifying(true);
    try {
      const formData = new FormData();
      Object.entries(verifyForm).forEach(([k, v]) => formData.append(k, v));
      if (addressProofFile) {
        formData.append('addressProof', addressProofFile);
      }
      const { data } = await api.post('/verification/submit', formData);
      const okMsg = `${data.message} (Provider Ref: ${data.verificationProviderReference})`;
      setMessage(okMsg);
      setVerifySuccess(okMsg);
      await refreshUser();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      setVerifyError(errMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/auth/profile', {
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        address: {
          city: profileForm.city,
          state: profileForm.state,
        },
      });
      setMessage(data.message);
      setEditingProfile(false);
      await refreshUser();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Adopter Portal
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <ShieldCheck
              className={`h-5 w-5 ${
                user?.verificationStatus === 'Verified'
                  ? 'text-emerald-600'
                  : 'text-orange-600'
              }`}
            />
            <div>
              <p className="text-[11px] uppercase font-bold text-slate-500">Identity Status</p>
              <StatusBadge status={user?.verificationStatus} />
            </div>
          </div>
          <Link
            to="/pets"
            className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-sm"
          >
            Browse Pets
          </Link>
        </div>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-8">
        {[
          { id: 'overview', label: 'Overview & Adopted Pets' },
          { id: 'applications', label: `My Applications (${requests.length})` },
          { id: 'verification', label: 'Identity Verification' },
          { id: 'care', label: `Care Reminders (${careSchedules.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
      ) : activeTab === 'overview' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Active Applications</p>
              <p className="font-display text-3xl font-extrabold text-slate-900 mt-1">
                {
                  requests.filter((r) =>
                    ['Pending', 'Under Review', 'Approved'].includes(r.applicationStatus)
                  ).length
                }
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Adopted Pets</p>
              <p className="font-display text-3xl font-extrabold text-emerald-700 mt-1">
                {adoptedPets.length}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Pending Care Tasks</p>
              <p className="font-display text-3xl font-extrabold text-orange-600 mt-1">
                {careSchedules.filter((s) => s.completionStatus === 'Pending').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-slate-900">Profile Information</h2>
              <button
                type="button"
                onClick={() => setEditingProfile(!editingProfile)}
                className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                {editingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            {editingProfile ? (
              <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  placeholder="Full Name"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Phone"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="City"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Save Profile
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
                <div><strong className="text-slate-900">Name:</strong> {user?.fullName}</div>
                <div><strong className="text-slate-900">Phone:</strong> {user?.phone || 'Not set'}</div>
                <div><strong className="text-slate-900">Location:</strong> {user?.address?.city || 'Not set'}{user?.address?.state ? `, ${user.address.state}` : ''}</div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-600" /> My Adopted Companions
              </h2>
              <Link to="/pet-care" className="text-sm font-semibold text-emerald-700 hover:underline">
                Open Full Care Dashboard →
              </Link>
            </div>

            {adoptedPets.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-300 text-center text-slate-600 text-sm">
                You haven&apos;t completed an adoption yet. Once an NGO finalizes your adoption, your companion and care schedule will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {adoptedPets.map((pet) => (
                  <div
                    key={pet._id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                  >
                    <img
                      src={resolveMediaUrl(pet.images?.[0]?.url)}
                      alt={pet.name}
                      className="h-44 w-full object-cover"
                    />
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold text-slate-900">{pet.name}</h3>
                        <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
                          Adopted
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{pet.breed} • {pet.species}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Adopted on {formatDate(pet.adoptedAt)}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Link
                          to="/pet-care"
                          className="flex-1 text-center py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Manage Care
                        </Link>
                        <Link
                          to={`/pets/${pet._id}`}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                        >
                          Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'applications' ? (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300">
              <FileCheck2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">No adoption applications yet</p>
              <Link to="/pets" className="text-sm font-semibold text-emerald-700 hover:underline mt-2 inline-block">
                Explore available pets →
              </Link>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req._id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={resolveMediaUrl(req.petId?.images?.[0]?.url)}
                    alt={req.petId?.name || 'Pet'}
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/pets/${req.petId?._id}`}
                        className="font-display font-bold text-slate-900 hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        {req.petId?.name} <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <StatusBadge status={req.applicationStatus} />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {req.petId?.breed} • Shelter: {req.ngoId?.organizationName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted {formatDate(req.submittedAt)}
                      {req.reviewNotes ? ` — Shelter Note: "${req.reviewNotes}"` : ''}
                    </p>
                  </div>
                </div>

                {['Pending', 'Under Review'].includes(req.applicationStatus) && (
                  <button
                    type="button"
                    onClick={() => handleCancelRequest(req._id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer self-start sm:self-center"
                  >
                    <XCircle className="h-4 w-4" /> Cancel Request
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'verification' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-1">
              Government Identity & Address Verification
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              Raw government ID numbers are transmitted directly to our verification provider and are never stored in plain text.
            </p>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Legal Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={verifyForm.fullName}
                    onChange={(e) => setVerifyForm({ ...verifyForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={verifyForm.dateOfBirth}
                    onChange={(e) => setVerifyForm({ ...verifyForm, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Government ID Type *
                  </label>
                  <select
                    value={verifyForm.idType}
                    onChange={(e) => setVerifyForm({ ...verifyForm, idType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Aadhaar / National ID">Aadhaar / National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver License">Driver License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Government ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={verifyForm.idNumber}
                    onChange={(e) => setVerifyForm({ ...verifyForm, idNumber: e.target.value })}
                    placeholder="Enter ID number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={verifyForm.phone}
                    onChange={(e) => setVerifyForm({ ...verifyForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={verifyForm.email}
                    onChange={(e) => setVerifyForm({ ...verifyForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Residential Address *
                </label>
                <input
                  type="text"
                  required
                  value={verifyForm.address}
                  onChange={(e) => setVerifyForm({ ...verifyForm, address: e.target.value })}
                  placeholder="House/Flat, Street, City, State, PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label htmlFor="addressProofInput" className="block text-sm font-semibold text-slate-700 mb-1">
                  ID / Address Proof Document (Any JPG, PNG, WebP, or PDF) *
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) {
                      setVerifyError('');
                      setAddressProofFile(dropped);
                    }
                  }}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                      <Upload className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {addressProofFile
                          ? `Selected: ${addressProofFile.name} (${(addressProofFile.size / 1024).toFixed(0)} KB)`
                          : 'Drag & drop or choose any JPG, PNG, or PDF file'}
                      </span>
                    </div>
                    <input
                      id="addressProofInput"
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      onChange={(e) => {
                        setVerifyError('');
                        setAddressProofFile(e.target.files?.[0] || null);
                      }}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {verifyError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{verifySuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm cursor-pointer disabled:opacity-60"
              >
                {verifying ? 'Verifying with Provider...' : 'Submit for Identity Verification'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-3">
              <h3 className="font-display font-bold text-slate-900">Verification Summary</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Current Status</span>
                <StatusBadge status={user?.verificationStatus} />
              </div>
              {user?.verificationProviderReference && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Provider Reference</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {user.verificationProviderReference}
                  </span>
                </div>
              )}
              {user?.verificationMetadata?.maskedIdLast4 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Verified ID</span>
                  <span className="font-semibold text-slate-800">
                    {user.verificationMetadata.idType} (••••{user.verificationMetadata.maskedIdLast4})
                  </span>
                </div>
              )}
              {user?.verificationMetadata?.notes && (
                <p className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                  {user.verificationMetadata.notes}
                </p>
              )}
            </div>

            <div className="bg-orange-50 rounded-3xl border border-orange-200 p-6 text-xs text-orange-900 space-y-1.5">
              <p className="font-bold uppercase tracking-wider">Development Provider Notice</p>
              <p>
                In local development (`ID_VERIFICATION_PROVIDER=mock`), real government KYC is simulated. You can test outcomes using ID endings: any digits → <strong>Verified</strong>, ending in <code>9999</code> → <strong>Requires Manual Review</strong>, ending in <code>0000</code> → <strong>Rejected</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-600" /> Upcoming Care Reminders
            </h2>
            <Link to="/pet-care" className="text-sm font-semibold text-emerald-700 hover:underline">
              Manage all reminders →
            </Link>
          </div>
          {careSchedules.length === 0 ? (
            <div className="p-10 text-center rounded-3xl border border-dashed border-slate-300 text-slate-600 text-sm">
              No care reminders scheduled yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careSchedules.slice(0, 6).map((item) => (
                <div key={item._id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-orange-700">{item.careType}</span>
                    <StatusBadge status={item.completionStatus} />
                  </div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.petId?.name} • {formatDate(item.reminderDate)} at {item.reminderTime}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdopterDashboardPage;
