import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  PawPrint,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import PetCard from '../components/PetCard';

const PetListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    species: searchParams.get('species') || 'All',
    breed: searchParams.get('breed') || '',
    minAge: searchParams.get('minAge') || '',
    maxAge: searchParams.get('maxAge') || '',
    gender: searchParams.get('gender') || 'All',
    location: searchParams.get('location') || '',
    vaccinated: searchParams.get('vaccinated') || '',
    adoptionStatus: searchParams.get('adoptionStatus') || 'Available',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
  });

  const [pets, setPets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const fetchPets = useCallback(async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([k, v]) => {
        if (v !== '' && v !== 'All') params.set(k, v);
      });
      if (activeFilters.adoptionStatus === 'All') {
        params.set('adoptionStatus', 'All');
      }
      params.set('limit', '9');

      const { data } = await api.get(`/pets/search?${params.toString()}`);
      setPets(data.data || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets(filters);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== 'All') params.set(k, v);
    });
    setSearchParams(params, { replace: true });
  }, [filters, fetchPets, setSearchParams]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const resetFilters = () => {
    setFilters({
      q: '',
      species: 'All',
      breed: '',
      minAge: '',
      maxAge: '',
      gender: 'All',
      location: '',
      vaccinated: '',
      adoptionStatus: 'Available',
      sort: 'newest',
      page: 1,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Verified Shelter Listings
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
            Find Your Companion
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Showing {pets.length} of {pagination.total} pets matching your criteria
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>

          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            aria-label="Sort pets"
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
          >
            <option value="newest">Newest Listings</option>
            <option value="oldest">Oldest Listings</option>
            <option value="age_asc">Age: Youngest First</option>
            <option value="age_desc">Age: Oldest First</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar */}
        <aside
          className={`lg:col-span-3 ${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}
          aria-label="Pet search filters"
        >
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" /> Filters
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Keyword Search
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => updateFilter('q', e.target.value)}
                  placeholder="Name, breed, city..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Species
              </label>
              <select
                value={filters.species}
                onChange={(e) => updateFilter('species', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="All">All Species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Bird">Bird</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Breed
              </label>
              <input
                type="text"
                value={filters.breed}
                onChange={(e) => updateFilter('breed', e.target.value)}
                placeholder="e.g. Golden Retriever"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Min Age (yrs)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.minAge}
                  onChange={(e) => updateFilter('minAge', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Max Age (yrs)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.maxAge}
                  onChange={(e) => updateFilter('maxAge', e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => updateFilter('gender', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="All">Any Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                placeholder="City or state..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Vaccination Status
              </label>
              <select
                value={filters.vaccinated}
                onChange={(e) => updateFilter('vaccinated', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="">All</option>
                <option value="true">Vaccinated Only</option>
                <option value="false">Vaccination Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Adoption Availability
              </label>
              <select
                value={filters.adoptionStatus}
                onChange={(e) => updateFilter('adoptionStatus', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="Available">Available</option>
                <option value="Pending">Adoption In Progress</option>
                <option value="Adopted">Adopted</option>
                <option value="All">All Statuses</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Pet Grid */}
        <div className="lg:col-span-9">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : pets.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-dashed border-slate-300 bg-slate-50/50">
              <PawPrint className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h2 className="font-display text-xl font-bold text-slate-900">No pets found</h2>
              <p className="text-sm text-slate-600 mt-1 mb-5">
                Try adjusting or resetting your search filters to see more companions.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <PetCard key={pet._id} pet={pet} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={filters.page <= 1}
                    onClick={() => updateFilter('page', filters.page - 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-slate-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={filters.page >= pagination.totalPages}
                    onClick={() => updateFilter('page', filters.page + 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetListingPage;
