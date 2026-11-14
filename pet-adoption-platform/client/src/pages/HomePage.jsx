import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Stethoscope,
  CalendarClock,
  Building2,
  ArrowRight,
  CheckCircle2,
  Heart,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import PetCard from '../components/PetCard';

const HomePage = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [species, setSpecies] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/pets?limit=6&adoptionStatus=Available');
        setFeaturedPets(data.data || []);
      } catch {
        setFeaturedPets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (species !== 'All') params.set('species', species);
    navigate(`/pets?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6">
                <ShieldCheck className="h-4 w-4" />
                100% Verified NGOs & Health-Checked Pets
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Adopt Responsibly.{' '}
                <span className="text-emerald-600">Care</span>{' '}
                <span className="text-orange-600">Forever.</span>
              </h1>
              <p className="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">
                Connect directly with verified animal shelters and rescue NGOs. Review complete vaccination & veterinary records, verify your identity securely, and manage lifelong post-adoption care reminders.
              </p>

              {/* Quick Search Bar */}
              <form
                onSubmit={handleQuickSearch}
                className="mt-8 p-2 bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col sm:flex-row gap-2 max-w-2xl"
              >
                <div className="flex-1 flex items-center gap-2.5 px-3">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search breed, pet name, or city..."
                    aria-label="Search pets"
                    className="w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  aria-label="Filter by species"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">All Species</option>
                  <option value="Dog">Dogs</option>
                  <option value="Cat">Cats</option>
                  <option value="Rabbit">Rabbits</option>
                  <option value="Bird">Birds</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  Find Pets
                </button>
              </form>

              <div className="mt-7 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Verified Vaccination Records
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Automated Care Reminders
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Zero Middlemen
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-emerald-50 aspect-[4/4]">
                <img
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1000&q=85"
                  alt="Happy adopted dog and cat"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Trusted Adoption Network
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      Every pet includes verified vet records
                    </p>
                  </div>
                  <span className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Heart className="h-5 w-5 fill-orange-600" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pets */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Ready for a Loving Home
              </span>
              <h2 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
                Featured Pets Waiting for You
              </h2>
            </div>
            <Link
              to="/pets"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Browse all pets <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : featuredPets.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-600">No pets listed yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPets.map((pet) => (
                <PetCard key={pet._id} pet={pet} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How Adoption Works */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Safe & Transparent Process
            </span>
            <h2 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
              How Verified Adoption Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Explore Pets',
                desc: 'Filter by species, breed, age, location, and vaccination status with full medical transparency.',
                icon: Search,
                color: 'bg-emerald-100 text-emerald-700',
              },
              {
                step: '02',
                title: 'Verify Identity',
                desc: 'Complete quick identity and address verification through our authorized verification flow.',
                icon: ShieldCheck,
                color: 'bg-orange-100 text-orange-700',
              },
              {
                step: '03',
                title: 'Apply & Connect',
                desc: 'Submit your adoption application directly to the shelter NGO and track status updates in real time.',
                icon: Stethoscope,
                color: 'bg-emerald-100 text-emerald-700',
              },
              {
                step: '04',
                title: 'Post-Adoption Care',
                desc: 'Get an automatic care dashboard with feeding, grooming, vet, and vaccination reminders.',
                icon: CalendarClock,
                color: 'bg-orange-100 text-orange-700',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`h-11 w-11 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-2xl font-extrabold text-slate-200">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pet Care & NGO CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8">
          <div className="rounded-3xl bg-emerald-600 text-white p-8 sm:p-10 flex flex-col justify-between shadow-lg">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-4">
                <Sparkles className="h-4 w-4" />
                Lifelong Companion Wellness
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold">
                Never Miss a Vaccine or Vet Checkup
              </h3>
              <p className="mt-3 text-emerald-50 text-sm sm:text-base leading-relaxed">
                Every completed adoption unlocks a personalized Pet Care Dashboard with automated cron-powered reminders for daily feeding, grooming, deworming, and booster vaccinations.
              </p>
            </div>
            <div className="mt-8">
              <Link
                to="/pet-care"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors"
              >
                Explore Care Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-orange-50 border border-orange-200 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold mb-4">
                <Building2 className="h-4 w-4" />
                For Shelters & Rescue Organizations
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Register Your Animal NGO
              </h3>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Manage pet profiles, upload medical & vaccination certificates, screen verified adopters, approve applications safely, and set post-adoption care schedules from one unified NGO dashboard.
              </p>
            </div>
            <div className="mt-8">
              <Link
                to="/register?role=ngo"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-colors shadow-sm"
              >
                Register Shelter / NGO <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
