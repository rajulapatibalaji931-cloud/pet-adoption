import { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Syringe,
  Utensils,
  Stethoscope,
  Scissors,
  Plus,
  CheckCircle2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { formatDate, resolveMediaUrl } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

const PetCareDashboardPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [adoptedPets, setAdoptedPets] = useState([]);
  const [careTypeFilter, setCareTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    petId: '',
    careType: 'Feeding',
    title: '',
    description: '',
    reminderDate: new Date().toISOString().split('T')[0],
    reminderTime: '09:00',
    recurrence: 'Daily',
  });

  const fetchCareData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/care/my-schedules');
      setSchedules(data.data || []);
      const pets = data.adoptedPets || [];
      setAdoptedPets(pets);
      if (pets.length > 0) {
        setNewTask((prev) => (prev.petId ? prev : { ...prev, petId: pets[0]._id }));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCareData();
  }, [fetchCareData]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    try {
      const selectedPet = adoptedPets.find((p) => p._id === newTask.petId);
      const { data } = await api.post('/care', {
        ...newTask,
        adopterId: selectedPet?.adoptedBy?._id || selectedPet?.adoptedBy,
      });
      setFeedback(data.message);
      setShowAddForm(false);
      setNewTask((prev) => ({ ...prev, title: '', description: '' }));
      fetchCareData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleComplete = async (id) => {
    setError('');
    setFeedback('');
    try {
      const { data } = await api.post(`/care/${id}/complete`, {});
      setFeedback(data.message);
      fetchCareData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/care/${id}`);
      fetchCareData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    if (careTypeFilter !== 'All' && s.careType !== careTypeFilter) return false;
    if (statusFilter !== 'All' && s.completionStatus !== statusFilter) return false;
    return true;
  });

  const pendingCount = schedules.filter((s) => s.completionStatus === 'Pending').length;
  const vaccinationCount = schedules.filter(
    (s) => s.careType === 'Vaccination' && s.completionStatus === 'Pending'
  ).length;
  const vetCount = schedules.filter(
    (s) => s.careType === 'Veterinary' && s.completionStatus === 'Pending'
  ).length;
  const completedCount = schedules.filter(
    (s) => s.completionStatus === 'Completed' || (s.completionHistory?.length || 0) > 0
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Post-Adoption Care Hub
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Pet Care & Reminder Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track daily feeding, upcoming vaccinations, veterinary visits, grooming, and deworming.
          </p>
        </div>

        {adoptedPets.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Care Reminder
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Care Tasks', value: pendingCount, icon: CalendarClock, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Upcoming Vaccinations', value: vaccinationCount, icon: Syringe, color: 'text-orange-600 bg-orange-50' },
          { label: 'Vet Appointments', value: vetCount, icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Completed Activities', value: completedCount, icon: CheckCircle2, color: 'text-sky-600 bg-sky-50' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="font-display text-2xl font-extrabold text-slate-900 mt-2">{card.value}</p>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
      {error && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Care Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="mb-8 bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-slate-900">Schedule New Care Task</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Pet *</label>
              <select
                required
                value={newTask.petId}
                onChange={(e) => setNewTask({ ...newTask, petId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {adoptedPets.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.breed})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Care Type *</label>
              <select
                value={newTask.careType}
                onChange={(e) => setNewTask({ ...newTask, careType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="Feeding">Feeding</option>
                <option value="Vaccination">Vaccination</option>
                <option value="Veterinary">Veterinary</option>
                <option value="Grooming">Grooming</option>
                <option value="Deworming">Deworming</option>
                <option value="Exercise">Exercise</option>
                <option value="Health Check">Health Check</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Recurrence</label>
              <select
                value={newTask.recurrence}
                onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="Once">Once</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g. Evening Meal"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date *</label>
              <input
                type="date"
                required
                value={newTask.reminderDate}
                onChange={(e) => setNewTask({ ...newTask, reminderDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Time</label>
              <input
                type="time"
                value={newTask.reminderTime}
                onChange={(e) => setNewTask({ ...newTask, reminderTime: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Instructions *</label>
            <textarea
              rows={2}
              required
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Care details, dosage, or veterinary clinic notes..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
            >
              Save Care Schedule
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {['All', 'Feeding', 'Vaccination', 'Veterinary', 'Grooming', 'Deworming', 'Exercise'].map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCareTypeFilter(type)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  careTypeFilter === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            )
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Upcoming / Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Schedules List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 bg-slate-50">
          <Utensils className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h2 className="font-display text-lg font-bold text-slate-900">No care schedules yet</h2>
          <p className="text-sm text-slate-600 mt-1">
            Care reminders are automatically generated as soon as an adoption is finalized.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={resolveMediaUrl(item.petId?.images?.[0]?.url)}
                  alt={item.petId?.name || 'Pet'}
                  className="h-14 w-14 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                      {item.careType}
                    </span>
                    <StatusBadge status={item.completionStatus} />
                    <span className="text-xs font-medium text-slate-500">{item.recurrence}</span>
                  </div>
                  <h3 className="font-display font-bold text-slate-900 truncate">{item.title}</h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                    For {item.petId?.name} • Due {formatDate(item.reminderDate)} at {item.reminderTime}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Scissors className="h-3.5 w-3.5" />
                  Completed {item.completionHistory?.length || 0}x
                </span>
                <div className="flex items-center gap-2">
                  {item.completionStatus !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => handleComplete(item._id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    aria-label="Delete schedule"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PetCareDashboardPage;
