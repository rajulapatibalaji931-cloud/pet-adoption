import { Link } from 'react-router-dom';
import { PawPrint, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <PawPrint className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-extrabold text-slate-900">
                Paw<span className="text-orange-600">Bridge</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Connecting verified animal shelters, NGOs, and compassionate adopters with complete medical transparency and lifelong post-adoption care reminders.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-4 w-4" />
              Verified NGOs & Identity-Checked Adopters
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/pets" className="hover:text-emerald-700 transition-colors">
                  Browse Available Pets
                </Link>
              </li>
              <li>
                <Link to="/register?role=ngo" className="hover:text-emerald-700 transition-colors">
                  Partner as an NGO
                </Link>
              </li>
              <li>
                <Link to="/pet-care" className="hover:text-emerald-700 transition-colors">
                  Post-Adoption Care
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Account
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/login" className="hover:text-emerald-700 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-700 transition-colors">
                  Adopter Registration
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-emerald-700 transition-colors">
                  Reset Password
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} PawBridge Pet Adoption & Care Platform. All rights reserved.</p>
          <p className="inline-flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-orange-600 fill-orange-600" /> for responsible animal welfare
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
