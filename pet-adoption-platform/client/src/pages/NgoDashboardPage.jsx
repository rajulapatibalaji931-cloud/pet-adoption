import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  PawPrint,
  ClipboardList,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatAge, formatDate, resolveMediaUrl } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

const NgoDashboardPage = () => {
  const { ngo } = useAuth();
  const [activeTab, setActiveTab] = useState('pets');
  const [pets, setPets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Add Pet Modal/Panel
  const [showAddPet, setShowAddPet] = useState(false);
  const [petImages, setPetImages] = useState([]);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '1',
    gender: 'Male',
    weight: '10',
    color: '',
    location: ngo?.address?.city ? `${ngo.address.city}, ${ngo.address.state}` : '',
    description: '',
    personality: 'Friendly, Playful',
    medicalHistory: '',
    isVaccinated: 'true',
    vaccinationSummary: '',
    sterilizationStatus: 'Sterilized',
    healthStatus: 'Healthy',
    vetName: '',
    clinicName: '',
    nextVaccinationDate: '',
  });

  // Edit Pet Modal
  const [editModalPet, setEditModalPet] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    age: '',
    weight: '',
    location: '',
    adoptionStatus: 'Available',
    healthStatus: 'Healthy',
    description: '',
  });

  // Add Medical Record Modal
  const [medModalPet, setMedModalPet] = useState(null);
  const [medDocFile, setMedDocFile] = useState(null);
  const [medForm, setMedForm] = useState({
    veterinarianName: '',
    clinicName: '',
    diagnosis: '',
    treatment: '',
    vaccineName: '',
    nextDueDate: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [petsRes, reqRes] = await Promise.all([
        api.get('/pets/ngo/my-pets'),
        api.get('/adoptions/ngo-requests'),
      ]);
      setPets(petsRes.data.data || []);
      setRequests(reqRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePet = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      Object.entries(petForm).forEach(([k, v]) => {
        if (v !== '') formData.append(k, v);
      });
      for (const file of petImages) {
        formData.append('images', file);
      }

      const { data } = await api.post('/pets', formData);
      setMessage(data.message);
      setShowAddPet(false);
      setPetImages([]);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Delete this pet profile permanently?')) return;
    try {
      await api.delete(`/pets/${petId}`);
      setMessage('Pet profile removed.');
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openEditPet = (pet) => {
    setEditModalPet(pet);
    setEditForm({
      name: pet.name || '',
      age: pet.age ?? '',
      weight: pet.weight ?? '',
      location: pet.location || '',
      adoptionStatus: pet.adoptionStatus || 'Available',
      healthStatus: pet.healthStatus || 'Healthy',
      description: pet.description || '',
    });
  };

  const handleUpdatePet = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/pets/${editModalPet._id}`, editForm);
      setMessage(data.message);
      setEditModalPet(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAdoptionDecision = async (reqId, status) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/adoptions/${reqId}/status`, { status });
      setMessage(data.message);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      Object.entries(medForm).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });
      if (medDocFile) formData.append('document', medDocFile);

      const { data } = await api.post(`/pets/${medModalPet._id}/medical-records`, formData);
      setMessage(data.message);
      setMedModalPet(null);
      setMedDocFile(null);
      setMedForm({
        veterinarianName: '',
        clinicName: '',
        diagnosis: '',
        treatment: '',
        vaccineName: '',
        nextDueDate: '',
      });
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const totalPets = pets.length;
  const availablePets = pets.filter((p) => p.adoptionStatus === 'Available').length;
  const pendingApps = requests.filter((r) =>
    ['Pending', 'Under Review'].includes(r.applicationStatus)
  ).length;
  const completedAdoptions = requests.filter((r) =>
    ['Approved', 'Completed'].includes(r.applicationStatus)
  ).length;

  const chartData = [
    { name: 'Available', count: availablePets },
    { name: 'Pending Pet', count: pets.filter((p) => p.adoptionStatus === 'Pending').length },
    { name: 'Adopted', count: pets.filter((p) => p.adoptionStatus === 'Adopted').length },
    { name: 'Open Apps', count: pendingApps },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              NGO Shelter Dashboard
            </span>
            {ngo && <StatusBadge status={ngo.verificationStatus} />}
          </div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            {ngo?.organizationName || 'Animal Shelter Portal'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Reg: {ngo?.registrationNumber} • {ngo?.address?.city}, {ngo?.address?.state}
          </p>
        </div>

        <button
          type="button"
          disabled={ngo?.verificationStatus !== 'Verified'}
          onClick={() => setShowAddPet(!showAddPet)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add New Pet
        </button>
      </div>

      {ngo?.verificationStatus !== 'Verified' && (
        <div className="mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-sm">
          Your NGO account is currently <strong>{ngo?.verificationStatus}</strong>. An administrator must verify your organization before you can publish new pet listings.
        </div>
      )}

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

      {/* KPI Cards + Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          {[
            { label: 'Total Pets Managed', value: totalPets, color: 'text-slate-900' },
            { label: 'Available for Adoption', value: availablePets, color: 'text-emerald-700' },
            { label: 'Pending Applications', value: pendingApps, color: 'text-orange-600' },
            { label: 'Approved / Completed', value: completedAdoptions, color: 'text-sky-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
              <p className={`font-display text-3xl font-extrabold mt-2 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Shelter Overview
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Pet Form */}
      {showAddPet && (
        <form
          onSubmit={handleCreatePet}
          className="mb-8 bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-display text-xl font-bold text-slate-900">
            Register New Pet (Medical & Vaccination Info Required)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Pet Name *</label>
              <input
                type="text"
                required
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Species *</label>
              <select
                value={petForm.species}
                onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Bird">Bird</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Breed *</label>
              <input
                type="text"
                required
                value={petForm.breed}
                onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Gender *</label>
              <select
                value={petForm.gender}
                onChange={(e) => setPetForm({ ...petForm, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Age (yrs) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={petForm.age}
                onChange={(e) => setPetForm({ ...petForm, age: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={petForm.weight}
                onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Color *</label>
              <input
                type="text"
                required
                value={petForm.color}
                onChange={(e) => setPetForm({ ...petForm, color: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Location *</label>
              <input
                type="text"
                required
                value={petForm.location}
                onChange={(e) => setPetForm({ ...petForm, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description *</label>
              <textarea
                rows={2}
                required
                value={petForm.description}
                onChange={(e) => setPetForm({ ...petForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Medical History & Health Notes *
              </label>
              <textarea
                rows={2}
                required
                value={petForm.medicalHistory}
                onChange={(e) => setPetForm({ ...petForm, medicalHistory: e.target.value })}
                placeholder="Wellness check summary, deworming, treatments..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vaccinated? *</label>
              <select
                value={petForm.isVaccinated}
                onChange={(e) => setPetForm({ ...petForm, isVaccinated: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="true">Yes - Vaccinated</option>
                <option value="false">Scheduled / Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sterilization</label>
              <select
                value={petForm.sterilizationStatus}
                onChange={(e) => setPetForm({ ...petForm, sterilizationStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="Sterilized">Sterilized</option>
                <option value="Not Sterilized">Not Sterilized</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Veterinarian Name *</label>
              <input
                type="text"
                required
                value={petForm.vetName}
                onChange={(e) => setPetForm({ ...petForm, vetName: e.target.value })}
                placeholder="Dr. Anita Verma"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Next Vaccination</label>
              <input
                type="date"
                value={petForm.nextVaccinationDate}
                onChange={(e) => setPetForm({ ...petForm, nextVaccinationDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Vaccination Details Summary *
              </label>
              <input
                type="text"
                required
                value={petForm.vaccinationSummary}
                onChange={(e) => setPetForm({ ...petForm, vaccinationSummary: e.target.value })}
                placeholder="e.g. Rabies & DHPPiL completed"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Pet Photos (Up to 6 images)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPetImages(Array.from(e.target.files || []))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddPet(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
            >
              Publish Pet Listing
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('pets')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
            activeTab === 'pets' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PawPrint className="h-4 w-4" /> Pet Inventory ({pets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
            activeTab === 'requests' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="h-4 w-4" /> Adoption Requests ({requests.length})
        </button>
      </div>

      {loading ? (
        <div className="h-56 rounded-3xl bg-slate-100 animate-pulse" />
      ) : activeTab === 'pets' ? (
        <div className="space-y-4">
          {pets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 text-slate-600">
              No pets registered yet. Click &ldquo;Add New Pet&rdquo; to publish your first rescue profile.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pets.map((pet) => (
                <div
                  key={pet._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex gap-4"
                >
                  <img
                    src={resolveMediaUrl(pet.images?.[0]?.url)}
                    alt={pet.name}
                    className="h-24 w-24 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/pets/${pet._id}`}
                        className="font-display font-bold text-slate-900 hover:text-emerald-700 truncate"
                      >
                        {pet.name}
                      </Link>
                      <StatusBadge status={pet.adoptionStatus} />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {pet.breed} • {formatAge(pet.age)} • {pet.gender}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Code: {pet.petCode}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditPet(pet)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        Edit / Status
                      </button>
                      <button
                        type="button"
                        onClick={() => setMedModalPet(pet)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer"
                      >
                        <Stethoscope className="h-3.5 w-3.5" /> Add Medical Record
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePet(pet._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 text-slate-600">
              No adoption applications received yet.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req._id}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveMediaUrl(req.petId?.images?.[0]?.url)}
                      alt={req.petId?.name}
                      className="h-14 w-14 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-slate-900">
                          {req.adopterId?.fullName} → {req.petId?.name}
                        </h3>
                        <StatusBadge status={req.applicationStatus} />
                      </div>
                      <p className="text-xs text-slate-600">
                        Adopter Verification: <strong>{req.adopterId?.verificationStatus}</strong> •
                        Email: {req.adopterId?.email} • Phone: {req.applicationDetails?.phone}
                      </p>
                      <p className="text-xs text-slate-500">Submitted {formatDate(req.submittedAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {req.applicationStatus === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleAdoptionDecision(req._id, 'Under Review')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        Mark Under Review
                      </button>
                    )}
                    {['Pending', 'Under Review'].includes(req.applicationStatus) && (
                      <button
                        type="button"
                        onClick={() => handleAdoptionDecision(req._id, 'Approved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {['Pending', 'Under Review', 'Approved'].includes(req.applicationStatus) && (
                      <button
                        type="button"
                        onClick={() => handleAdoptionDecision(req._id, 'Completed')}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Finalize Adoption
                      </button>
                    )}
                    {['Pending', 'Under Review', 'Approved'].includes(req.applicationStatus) && (
                      <button
                        type="button"
                        onClick={() => handleAdoptionDecision(req._id, 'Rejected')}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-500 block">Housing & Address</span>
                    {req.applicationDetails?.housingType} — {req.applicationDetails?.residentialAddress}
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Pet Experience</span>
                    {req.applicationDetails?.petOwnershipExperience}
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Reason & Availability</span>
                    {req.applicationDetails?.reasonForAdoption} ({req.applicationDetails?.availabilityToCare})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Pet Modal */}
      {editModalPet && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900 mb-3">
              Edit {editModalPet.name} & Availability
            </h3>
            <form onSubmit={handleUpdatePet} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Availability</label>
                  <select
                    value={editForm.adoptionStatus}
                    onChange={(e) => setEditForm({ ...editForm, adoptionStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Pending">Pending</option>
                    <option value="Adopted">Adopted</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age (yrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Health</label>
                  <select
                    value={editForm.healthStatus}
                    onChange={(e) => setEditForm({ ...editForm, healthStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Special Needs">Special Needs</option>
                    <option value="Recovering">Recovering</option>
                    <option value="Under Treatment">Under Treatment</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalPet(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medical Record Modal */}
      {medModalPet && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900 mb-1">
              Add Medical / Vaccination Record for {medModalPet.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload vaccination certificates or clinical checkups.
            </p>
            <form onSubmit={handleAddMedicalRecord} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Veterinarian Name *"
                  value={medForm.veterinarianName}
                  onChange={(e) => setMedForm({ ...medForm, veterinarianName: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  placeholder="Clinic Name"
                  value={medForm.clinicName}
                  onChange={(e) => setMedForm({ ...medForm, clinicName: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Diagnosis / Checkup Summary *"
                value={medForm.diagnosis}
                onChange={(e) => setMedForm({ ...medForm, diagnosis: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Vaccine Administered"
                  value={medForm.vaccineName}
                  onChange={(e) => setMedForm({ ...medForm, vaccineName: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <input
                  type="date"
                  placeholder="Next Due Date"
                  value={medForm.nextDueDate}
                  onChange={(e) => setMedForm({ ...medForm, nextDueDate: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Certificate / Report (PDF or Image)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setMedDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMedModalPet(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Save Medical Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NgoDashboardPage;
