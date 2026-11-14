const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

/**
 * Integrates with an authorized government identity verification provider.
 * IMPORTANT:
 * - Raw government ID numbers are NEVER stored in the database.
 * - Only masked last-4 digits and provider reference IDs are persisted.
 * - Mock verification is strictly restricted to NODE_ENV=development and ID_VERIFICATION_PROVIDER=mock.
 */
const submitToVerificationProvider = async ({
  userId,
  fullName,
  dateOfBirth,
  idType,
  idNumber,
  address,
  phone,
  email,
  addressProofUrl,
}) => {
  const providerMode = process.env.ID_VERIFICATION_PROVIDER || 'mock';
  const isDev = process.env.NODE_ENV !== 'production';

  if (providerMode === 'mock') {
    if (!isDev) {
      throw new ApiError(
        503,
        'Mock identity verification is disabled in production. Configure an authorized verification provider.'
      );
    }

    // Deterministic development-only simulation
    // Rules for testing all statuses easily in dev:
    // - ID ending in "0000" -> Rejected
    // - ID ending in "9999" -> Requires Manual Review
    // - ID ending in "1111" -> Pending (awaiting webhook)
    // - Any other valid 6+ char ID -> Verified immediately
    const cleanId = String(idNumber || '').trim();
    const last4 = cleanId.slice(-4);
    const providerRef = `DEV-MOCK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    let status = 'Verified';
    let notes = 'Development mock verification approved. Replace with authorized KYC provider in production.';
    if (last4 === '0000') {
      status = 'Rejected';
      notes = 'Mock verification rejected (test ID ending in 0000).';
    } else if (last4 === '9999') {
      status = 'Requires Manual Review';
      notes = 'Flagged for manual admin review (test ID ending in 9999).';
    } else if (last4 === '1111') {
      status = 'Pending';
      notes = 'Awaiting async provider webhook callback (test ID ending in 1111).';
    }

    return {
      provider: 'mock-dev',
      providerReference: providerRef,
      status,
      maskedIdLast4: last4,
      notes,
      isMock: true,
    };
  }

  // External authorized verification provider call (HTTPS)
  const apiUrl = process.env.ID_VERIFICATION_API_URL;
  const apiKey = process.env.ID_VERIFICATION_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new ApiError(
      503,
      'Authorized government ID verification provider is not configured. Please set ID_VERIFICATION_API_URL and ID_VERIFICATION_API_KEY.'
    );
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      referenceId: String(userId),
      fullName,
      dateOfBirth,
      documentType: idType,
      documentNumber: idNumber,
      address,
      phone,
      email,
      addressProofUrl,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new ApiError(502, `Identity verification provider error: ${errText || response.statusText}`);
  }

  const data = await response.json();
  const cleanId = String(idNumber || '').trim();

  return {
    provider: 'external',
    providerReference: data.verificationId || data.reference_id,
    status: data.status || 'Pending',
    maskedIdLast4: cleanId.slice(-4),
    notes: data.message || 'Submitted to authorized identity verification provider.',
    isMock: false,
  };
};

module.exports = {
  submitToVerificationProvider,
};
