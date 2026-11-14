import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  MapPin,
  Syringe,
  ShieldCheck,
  Stethoscope,
  Building2,
  Flag,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileText,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatAge, formatDate, resolveMediaUrl } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

const PetDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Adoption form state
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    const fetchPet = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/pets/${id}`);
        setPet(data.pet);
        setMedicalRecords(data.medicalRecords || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  const onAdoptSubmit = async (values) => {
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const { data } = await api.post('/adoptions', {
        petId: pet._id,
        residentialAddress: values.residentialAddress,
        housingType: values.housingType,
        petOwnershipExperience: values.petOwnershipExperience,
        reasonForAdoption: values.reasonForAdoption,
        familyApproval: values.familyApproval,
        availabilityToCare: values.availabilityToCare,
        preferredContactMethod: values.preferredContactMethod,
        phone: values.phone,
      });
      setSubmitSuccess(data.message);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/pets/${pet._id}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      setReportMessage(data.message);
      setTimeout(() => {
        setReportOpen(false);
        setReportMessage('');
        setReportReason('');
        setReportDetails('');
      }, 1500);
    } catch (err) {
      setReportMessage(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h1 className="font-display text-2xl font-bold text-slate-900">Pet Not Found</h1>
        <p className="text-slate-600 mt-1 mb-6">{error}</p>
        <Link
          to="/pets"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pet Listings
        </Link>
      </div>
    );
  }

  const images = pet.images?.length ? pet.images : [{ url: '' }];
  const canApply =
    isAuthenticated &&
    user?.role === 'adopter' &&
    user?.verificationStatus === 'Verified' &&
    ['Available', 'Pending'].includes(pet.adoptionStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/pets"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
          >
            <Flag className="h-3.5 w-3.5" /> Report listing
          </button>
        )}
      </div>

      {/* Top Grid: Gallery + Core Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            <img
              src={resolveMediaUrl(images[selectedImage]?.url)}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`h-20 w-24 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer ${
                    selectedImage === idx ? 'border-emerald-600' : 'border-transparent opacity-70'
                  }`}
                >
                  <img
                    src={resolveMediaUrl(img.url)}
                    alt={`${pet.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Core Info */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={pet.adoptionStatus} />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                ID: {pet.petCode}
              </span>
              <StatusBadge status={pet.healthStatus} />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
              {pet.name}
            </h1>
            <p className="text-base text-slate-600 mt-1">
              {pet.breed} • {pet.species}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-orange-600" />
              {pet.location}
            </div>
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Age', value: formatAge(pet.age) },
              { label: 'Gender', value: pet.gender },
              { label: 'Weight', value: `${pet.weight} kg` },
              { label: 'Color', value: pet.color },
            ].map((spec) => (
              <div key={spec.label} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {spec.label}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{spec.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 mb-2">About {pet.name}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{pet.description}</p>
            {pet.personality?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pet.personality.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* NGO Card */}
          {pet.ngoId && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-slate-900">
                    {pet.ngoId.organizationName}
                  </h3>
                  <StatusBadge status={pet.ngoId.verificationStatus} />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Reg No: {pet.ngoId.registrationNumber} • {pet.ngoId.address?.city},{' '}
                  {pet.ngoId.address?.state}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Contact: {pet.ngoId.contactDetails?.email} | {pet.ngoId.contactDetails?.phone}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medical & Vaccination History + Adoption Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        {/* Medical & Vaccination Records */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Stethoscope className="h-5 w-5 text-emerald-600" />
              Medical & Vaccination Information
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Vaccination Status</span>
                <span className="font-semibold text-slate-900">
                  {pet.vaccinationRecords?.isVaccinated ? 'Up to Date' : 'Pending / Scheduled'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Sterilization Status</span>
                <span className="font-semibold text-slate-900">{pet.sterilizationStatus}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Attending Veterinarian</span>
                <span className="font-semibold text-slate-900">
                  {pet.veterinaryInfo?.vetName}
                  {pet.veterinaryInfo?.clinicName ? ` (${pet.veterinaryInfo.clinicName})` : ''}
                </span>
              </div>
              {pet.nextVaccinationDate && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Next Vaccination Due</span>
                  <span className="font-semibold text-orange-700">
                    {formatDate(pet.nextVaccinationDate)}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Medical Summary
                </p>
                <p className="text-slate-700 leading-relaxed">{pet.medicalHistory}</p>
                {pet.vaccinationRecords?.summary && (
                  <p className="text-emerald-700 font-medium mt-2 flex items-center gap-1.5">
                    <Syringe className="h-4 w-4" /> {pet.vaccinationRecords.summary}
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Vet Records */}
            {medicalRecords.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Verified Veterinary Logs ({medicalRecords.length})
                </h3>
                <div className="space-y-3">
                  {medicalRecords.map((rec) => (
                    <div key={rec._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{rec.veterinarianName}</span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(rec.recordDate)}
                        </span>
                      </div>
                      <p className="text-slate-700">{rec.diagnosis}</p>
                      {rec.vaccinationDetails?.vaccineName && (
                        <p className="text-emerald-700 font-medium">
                          Vaccine: {rec.vaccinationDetails.vaccineName}
                        </p>
                      )}
                      {rec.documentUrl && (
                        <a
                          href={resolveMediaUrl(rec.documentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-orange-600 font-semibold hover:underline pt-1"
                        >
                          <FileText className="h-3.5 w-3.5" /> View Vaccination / Medical Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adoption Application Form */}
        <div id="adopt-form" className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-1">
              Adopt {pet.name}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Submit your verified adoption application directly to {pet.ngoId?.organizationName}.
            </p>

            {pet.adoptionStatus === 'Adopted' || pet.adoptionStatus === 'Unavailable' ? (
              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-sm">
                <strong>{pet.name}</strong> has status <strong>{pet.adoptionStatus}</strong> and is
                no longer accepting new adoption requests.
              </div>
            ) : !isAuthenticated ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <ShieldCheck className="h-10 w-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-slate-900">Sign in to Apply for Adoption</h3>
                <p className="text-sm text-slate-600">
                  Only registered and identity-verified adopters can submit adoption requests.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: { pathname: `/pets/${pet._id}` } } })}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
                  >
                    Sign In
                  </button>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : user?.role !== 'adopter' ? (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                You are signed in as <strong>{user?.role.toUpperCase()}</strong>. Only Adopter accounts can submit adoption requests.
              </div>
            ) : user?.verificationStatus !== 'Verified' ? (
              <div className="p-6 rounded-2xl bg-orange-50 border border-orange-200 space-y-3">
                <div className="flex items-center gap-2 text-orange-900 font-bold">
                  <ShieldCheck className="h-5 w-5 text-orange-600" />
                  Identity Verification Required
                </div>
                <p className="text-sm text-orange-800">
                  Your current verification status is{' '}
                  <strong>{user?.verificationStatus}</strong>. Complete identity & address verification in your Adopter Dashboard to unlock adoption applications.
                </p>
                <Link
                  to="/dashboard/adopter?tab=verification"
                  className="inline-block px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold"
                >
                  Complete Identity Verification
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onAdoptSubmit)} className="space-y-4">
                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">{submitSuccess}</p>
                      <Link
                        to="/dashboard/adopter"
                        className="text-xs font-bold underline text-emerald-900 mt-1 inline-block"
                      >
                        Track status in Adopter Dashboard
                      </Link>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  Verified Adopter: <strong>{user.fullName}</strong> ({user.email})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      defaultValue={user.phone || ''}
                      {...register('phone', { required: 'Phone is required' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                    {errors.phone && (
                      <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Preferred Contact *
                    </label>
                    <select
                      {...register('preferredContactMethod')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="Phone">Phone</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Residential Address *
                  </label>
                  <input
                    type="text"
                    defaultValue={
                      user.address?.street
                        ? `${user.address.street}, ${user.address.city || ''}`
                        : ''
                    }
                    {...register('residentialAddress', { required: 'Address is required' })}
                    placeholder="Full residential address"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                  {errors.residentialAddress && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.residentialAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Housing Type *
                  </label>
                  <select
                    {...register('housingType', { required: 'Housing type is required' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Independent House">Independent House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Farmhouse">Farmhouse</option>
                    <option value="Shared Accommodation">Shared Accommodation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Pet Ownership Experience *
                  </label>
                  <textarea
                    rows={2}
                    {...register('petOwnershipExperience', {
                      required: 'Please describe your experience with pets',
                    })}
                    placeholder="Have you cared for pets previously?"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                  {errors.petOwnershipExperience && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.petOwnershipExperience.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Reason for Adoption *
                  </label>
                  <textarea
                    rows={2}
                    {...register('reasonForAdoption', {
                      required: 'Please share why you want to adopt this pet',
                    })}
                    placeholder="Why is your home a great fit?"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                  {errors.reasonForAdoption && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.reasonForAdoption.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Daily Availability to Care *
                  </label>
                  <input
                    type="text"
                    {...register('availabilityToCare', {
                      required: 'Availability details are required',
                    })}
                    placeholder="e.g. Work from home, 3+ hours daily walks & play"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                  {errors.availabilityToCare && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.availabilityToCare.message}
                    </p>
                  )}
                </div>

                <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('familyApproval', {
                      required: 'Family / household approval is required',
                    })}
                    className="mt-1 h-4 w-4 accent-emerald-600"
                  />
                  <span>
                    All members of my household approve and are committed to caring for {pet.name}.
                  </span>
                </label>
                {errors.familyApproval && (
                  <p className="text-xs text-rose-600">{errors.familyApproval.message}</p>
                )}

                <button
                  type="submit"
                  disabled={!canApply || isSubmitting}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Submitting Application...' : `Submit Adoption Request for ${pet.name}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900 mb-2">
              Report Suspicious Listing
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Flag inaccurate medical info, suspicious fees, or welfare concerns for admin review.
            </p>
            {reportMessage && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium">
                {reportMessage}
              </div>
            )}
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason (e.g. Incorrect medical info)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Additional details..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetDetailsPage;
