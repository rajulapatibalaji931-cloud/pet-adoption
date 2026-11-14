import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserCheck, Building2, AlertCircle, PawPrint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'ngo' ? 'ngo' : 'adopter';
  const [role, setRole] = useState(initialRole);
  const [serverError, setServerError] = useState('');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('role') === 'ngo') setRole('ngo');
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const payload = {
        role,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        address: {
          street: values.street || '',
          city: values.city || '',
          state: values.state || '',
          postalCode: values.postalCode || '',
          country: 'India',
        },
        ...(role === 'ngo'
          ? {
              organizationName: values.organizationName,
              registrationNumber: values.registrationNumber,
              ngoDescription: values.ngoDescription,
              website: values.website,
            }
          : {}),
      };

      const data = await registerUser(payload);
      if (data.user.role === 'ngo') navigate('/dashboard/ngo');
      else navigate('/dashboard/adopter');
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white mb-3">
            <PawPrint className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Create Your Account
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Join PawBridge as a responsible adopter or verified animal welfare NGO
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100 mb-6">
          <button
            type="button"
            onClick={() => setRole('adopter')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              role === 'adopter'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Adopter (Pet Seeker)
          </button>
          <button
            type="button"
            onClick={() => setRole('ngo')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              role === 'ngo'
                ? 'bg-white text-orange-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            NGO / Animal Shelter
          </button>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {role === 'ngo' ? 'Contact Person Name' : 'Full Name'} *
              </label>
              <input
                type="text"
                {...register('fullName', { required: 'Full name is required' })}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
              {errors.fullName && (
                <p className="text-xs text-rose-600 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                {...register('phone', { required: 'Phone number is required' })}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
              {errors.phone && (
                <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters required' },
                })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          {role === 'ngo' && (
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-800">
                NGO / Shelter Registration Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    {...register('organizationName', {
                      required: role === 'ngo' ? 'Organization name is required' : false,
                    })}
                    placeholder="Happy Paws Rescue"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-orange-600 focus:outline-none"
                  />
                  {errors.organizationName && (
                    <p className="text-xs text-rose-600 mt-1">{errors.organizationName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Govt Registration No. *
                  </label>
                  <input
                    type="text"
                    {...register('registrationNumber', {
                      required: role === 'ngo' ? 'Registration number is required' : false,
                    })}
                    placeholder="NGO-KA-2026-1029"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-orange-600 focus:outline-none"
                  />
                  {errors.registrationNumber && (
                    <p className="text-xs text-rose-600 mt-1">{errors.registrationNumber.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Shelter Description
                </label>
                <textarea
                  rows={2}
                  {...register('ngoDescription')}
                  placeholder="Tell adopters about your sanctuary and rescue mission..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-orange-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                {...register('street')}
                placeholder="123 Main St"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                {...register('city', { required: 'City is required' })}
                placeholder="Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
              {errors.city && (
                <p className="text-xs text-rose-600 mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                {...register('state', { required: 'State is required' })}
                placeholder="Karnataka"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
              {errors.state && (
                <p className="text-xs text-rose-600 mt-1">{errors.state.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm text-white shadow-sm transition-colors cursor-pointer ${
              role === 'ngo'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            } disabled:opacity-60`}
          >
            {isSubmitting
              ? 'Creating account...'
              : role === 'ngo'
                ? 'Register NGO Account'
                : 'Create Adopter Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
