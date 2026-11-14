import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  PawPrint,
  UserCheck,
  Building2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState('adopter');
  const [serverError, setServerError] = useState('');

  const lastAdopterEmail = localStorage.getItem('pawbridge_last_adopter_email') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const roleSuggestions = {
    adopter: {
      title: 'Adopter Login Suggestion',
      email: lastAdopterEmail || '',
      hint: lastAdopterEmail
        ? `Last registered/used adopter: ${lastAdopterEmail}`
        : 'Sign in with your registered adopter email, or create a new adopter account below.',
      badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    ngo: {
      title: 'NGO Login Suggestion',
      email: 'chandu@gmail.com',
      password: 'Password123!',
      hint: 'Suggested NGO account: chandu@gmail.com (Password: Password123!)',
      badgeColor: 'bg-orange-50 border-orange-200 text-orange-900',
    },
    admin: {
      title: 'Admin Login Suggestion',
      email: 'balaji@gmail.com',
      password: 'Password123!',
      hint: 'Suggested Admin account: balaji@gmail.com (Password: Password123!)',
      badgeColor: 'bg-slate-100 border-slate-200 text-slate-900',
    },
  };

  const currentSuggestion = roleSuggestions[selectedRole];

  const applySuggestion = () => {
    if (currentSuggestion.email) {
      setValue('email', currentSuggestion.email, { shouldValidate: true });
    }
    if (currentSuggestion.password) {
      setValue('password', currentSuggestion.password, { shouldValidate: true });
    }
  };

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const data = await login(values.email, values.password);
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      if (data.user.role === 'admin') navigate('/dashboard/admin', { replace: true });
      else if (data.user.role === 'ngo') navigate('/dashboard/ngo', { replace: true });
      else navigate('/dashboard/adopter', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white mb-3">
            <PawPrint className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-600 mt-1">
            Select your account type and sign in
          </p>
        </div>

        {/* Role Selector Options */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 mb-4">
          <button
            type="button"
            onClick={() => setSelectedRole('adopter')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedRole === 'adopter'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Adopter
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ngo')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedRole === 'ngo'
                ? 'bg-white text-orange-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            NGO
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </button>
        </div>

        {/* Role Account Suggestion */}
        <div className={`mb-5 p-3 rounded-xl border text-xs flex items-start justify-between gap-2 ${currentSuggestion.badgeColor}`}>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{currentSuggestion.title}</p>
              <p className="mt-0.5 opacity-90">{currentSuggestion.hint}</p>
            </div>
          </div>
          {currentSuggestion.email && (
            <button
              type="button"
              onClick={applySuggestion}
              className="px-2.5 py-1 rounded-lg bg-white border border-current/20 font-semibold shrink-0 hover:opacity-80 cursor-pointer"
            >
              Use
            </button>
          )}
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
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="email"
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder={
                  selectedRole === 'admin'
                    ? 'balaji@gmail.com'
                    : selectedRole === 'ngo'
                      ? 'chandu@gmail.com'
                      : lastAdopterEmail || 'you@gmail.com'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="password"
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-orange-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
