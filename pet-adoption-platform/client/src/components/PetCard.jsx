import { Link } from 'react-router-dom';
import { MapPin, Syringe, HeartPulse, ArrowRight } from 'lucide-react';
import { formatAge, resolveMediaUrl } from '../utils/formatters';
import StatusBadge from './StatusBadge';

const PetCard = ({ pet }) => {
  const primaryImage = resolveMediaUrl(pet.images?.[0]?.url);
  const isVaccinated = pet.vaccinationRecords?.isVaccinated;

  return (
    <article className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <Link to={`/pets/${pet._id}`} className="relative block aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={`${pet.name} - ${pet.breed}`}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <StatusBadge status={pet.adoptionStatus} className="shadow-sm backdrop-blur-sm" />
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-slate-800 shadow-sm">
            {pet.species}
          </span>
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {pet.name}
            </h3>
            <p className="text-sm text-slate-600">{pet.breed}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {formatAge(pet.age)} • {pet.gender}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
          <span className="truncate">{pet.location}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
              isVaccinated
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            <Syringe className="h-3.5 w-3.5" />
            {isVaccinated ? 'Vaccinated' : 'Schedule Pending'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
            <HeartPulse className="h-3.5 w-3.5 text-emerald-600" />
            {pet.healthStatus}
          </span>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2.5">
          <Link
            to={`/pets/${pet._id}`}
            className="flex-1 text-center px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View Details
          </Link>
          <Link
            to={`/pets/${pet._id}#adopt-form`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
          >
            Adopt Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PetCard;
