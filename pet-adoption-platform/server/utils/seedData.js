require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const NGO = require('../models/NGO');
const Pet = require('../models/Pet');
const MedicalRecord = require('../models/MedicalRecord');
const AdoptionRequest = require('../models/AdoptionRequest');
const CareSchedule = require('../models/CareSchedule');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Report = require('../models/Report');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database records...');
    await Promise.all([
      User.deleteMany({}),
      NGO.deleteMany({}),
      Pet.deleteMany({}),
      MedicalRecord.deleteMany({}),
      AdoptionRequest.deleteMany({}),
      CareSchedule.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      Report.deleteMany({}),
    ]);

    console.log('Creating Admin (Balaji) and NGO (Chandu)...');
    const adminUser = await User.create({
      fullName: 'Balaji',
      email: 'balaji@gmail.com',
      password: 'Password123!',
      phone: '+91 9800000001',
      role: 'admin',
      verificationStatus: 'Verified',
      address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    });

    const ngoUser = await User.create({
      fullName: 'Chandu',
      email: 'chandu@gmail.com',
      password: 'Password123!',
      phone: '+91 9811112222',
      role: 'ngo',
      verificationStatus: 'Verified',
      address: {
        street: '42 Rescue Lane',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
      },
    });

    const chanduNgo = await NGO.create({
      userId: ngoUser._id,
      organizationName: 'Chandu Animal Welfare Sanctuary',
      registrationNumber: 'NGO-KA-2024-4421',
      address: {
        street: '42 Rescue Lane',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
      },
      contactDetails: {
        email: 'chandu@gmail.com',
        phone: '+91 9811112222',
        website: 'https://chandusanctuary.example.org',
      },
      description:
        'Non-profit rescue and rehabilitation sanctuary managed by Chandu, caring for abandoned dogs, cats, rabbits, and birds across India.',
      verificationStatus: 'Verified',
    });

    console.log('Creating available pets under Chandu NGO...');
    const samplePets = [
      {
        ngoId: chanduNgo._id,
        name: 'Bruno',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 2,
        gender: 'Male',
        weight: 26,
        color: 'Golden',
        description:
          'Bruno is a gentle, affectionate Golden Retriever who loves morning walks, fetch, and children. House-trained and eager to please.',
        personality: ['Friendly', 'Gentle', 'Playful', 'House-Trained'],
        location: 'Bengaluru, Karnataka',
        images: [
          { url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80' },
          { url: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'Complete wellness check cleared. Dewormed and tick-free. No chronic conditions.',
        vaccinationRecords: {
          isVaccinated: true,
          summary: 'Rabies, DHPPiL, and Kennel Cough up to date.',
          vaccines: [
            { name: 'Rabies', dateAdministered: new Date('2026-06-10'), nextDueDate: new Date('2027-06-10') },
            { name: 'DHPPiL 7-in-1', dateAdministered: new Date('2026-07-02'), nextDueDate: new Date('2027-07-02') },
          ],
        },
        sterilizationStatus: 'Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Kavita Rao', clinicName: 'Cessna Pet Clinic', clinicPhone: '+91 80 41234567' },
        nextVaccinationDate: new Date('2027-06-10'),
        adoptionStatus: 'Available',
      },
      {
        ngoId: chanduNgo._id,
        name: 'Milo',
        species: 'Cat',
        breed: 'British Shorthair',
        age: 1.5,
        gender: 'Male',
        weight: 4.5,
        color: 'Blue Grey',
        description:
          'Milo is a calm, indoor-loving cat who enjoys sunny windowsills and quiet companionship. Litter-box trained and comfortable in apartments.',
        personality: ['Calm', 'Affectionate', 'Litter-Trained', 'Indoor'],
        location: 'Bengaluru, Karnataka',
        images: [
          { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80' },
          { url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'FIV/FeLV negative. Dental check healthy. Neutered and microchipped.',
        vaccinationRecords: {
          isVaccinated: true,
          summary: 'Tricat Trio and Anti-Rabies vaccinations completed.',
          vaccines: [{ name: 'FVRCP Tricat', dateAdministered: new Date('2026-08-15'), nextDueDate: new Date('2027-08-15') }],
        },
        sterilizationStatus: 'Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Kavita Rao', clinicName: 'Cessna Pet Clinic', clinicPhone: '+91 80 41234567' },
        nextVaccinationDate: new Date('2027-08-15'),
        adoptionStatus: 'Available',
      },
      {
        ngoId: chanduNgo._id,
        name: 'Luna',
        species: 'Dog',
        breed: 'Indian Pariah (Indie)',
        age: 1,
        gender: 'Female',
        weight: 16,
        color: 'Fawn & White',
        description:
          'Luna is an intelligent, resilient Indie pup rescued as a stray. She adapts quickly, bonds deeply, and thrives in active households.',
        personality: ['Smart', 'Loyal', 'Energetic', 'Alert'],
        location: 'Pune, Maharashtra',
        images: [
          { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80' },
          { url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'Recovered fully from minor malnutrition at rescue. Blood panel normal.',
        vaccinationRecords: {
          isVaccinated: true,
          summary: 'All primary puppy vaccinations completed.',
          vaccines: [{ name: 'Rabies & 9-in-1', dateAdministered: new Date('2026-09-01'), nextDueDate: new Date('2027-09-01') }],
        },
        sterilizationStatus: 'Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Siddharth Joshi', clinicName: 'Pune Pet Wellness', clinicPhone: '+91 20 25678900' },
        nextVaccinationDate: new Date('2027-09-01'),
        adoptionStatus: 'Available',
      },
      {
        ngoId: chanduNgo._id,
        name: 'Coco',
        species: 'Rabbit',
        breed: 'Holland Lop',
        age: 0.8,
        gender: 'Female',
        weight: 1.8,
        color: 'Cream & Caramel',
        description:
          'Coco is a curious, gentle Holland Lop rabbit who loves leafy greens, cardboard tunnels, and gentle head rubs.',
        personality: ['Curious', 'Gentle', 'Quiet'],
        location: 'Pune, Maharashtra',
        images: [
          { url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'Teeth alignment checked and normal. Parasite-free.',
        vaccinationRecords: {
          isVaccinated: true,
          summary: 'RHDV preventive immunization administered.',
          vaccines: [{ name: 'RHDV2', dateAdministered: new Date('2026-09-20'), nextDueDate: new Date('2027-09-20') }],
        },
        sterilizationStatus: 'Not Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Siddharth Joshi', clinicName: 'Pune Pet Wellness', clinicPhone: '+91 20 25678900' },
        nextVaccinationDate: new Date('2027-09-20'),
        adoptionStatus: 'Available',
      },
      {
        ngoId: chanduNgo._id,
        name: 'Bella',
        species: 'Cat',
        breed: 'Siamese Mix',
        age: 3,
        gender: 'Female',
        weight: 3.9,
        color: 'Seal Point',
        description:
          'Bella is a vocal, affectionate Siamese mix who loves interactive feather toys and curling up beside her humans in the evening.',
        personality: ['Talkative', 'Affectionate', 'Playful'],
        location: 'Bengaluru, Karnataka',
        images: [
          { url: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'Annual blood panel normal. Mild sensitive stomach managed with grain-free diet.',
        vaccinationRecords: {
          isVaccinated: true,
          summary: 'Core FVRCP and Rabies booster up to date.',
          vaccines: [{ name: 'FVRCP Booster', dateAdministered: new Date('2026-05-12'), nextDueDate: new Date('2027-05-12') }],
        },
        sterilizationStatus: 'Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Kavita Rao', clinicName: 'Cessna Pet Clinic', clinicPhone: '+91 80 41234567' },
        nextVaccinationDate: new Date('2027-05-12'),
        adoptionStatus: 'Available',
      },
      {
        ngoId: chanduNgo._id,
        name: 'Rocky',
        species: 'Dog',
        breed: 'Beagle',
        age: 4,
        gender: 'Male',
        weight: 12.5,
        color: 'Tricolor',
        description:
          'Rocky is a cheerful Beagle with a wonderful nose for treats and adventures. Gets along well with other calm dogs.',
        personality: ['Cheerful', 'Social', 'Curious'],
        location: 'Mumbai, Maharashtra',
        images: [
          { url: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'Cleared ear infection 3 months ago; routine ear cleaning recommended weekly.',
        vaccinationRecords: {
          isVaccinated: true,
          summary: 'Annual booster scheduled next month.',
          vaccines: [{ name: 'Rabies', dateAdministered: new Date('2025-12-10'), nextDueDate: new Date('2026-12-10') }],
        },
        sterilizationStatus: 'Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Neha Deshmukh', clinicName: 'Happy Paws Vet', clinicPhone: '+91 22 24112233' },
        nextVaccinationDate: new Date('2026-12-10'),
        adoptionStatus: 'Available',
      },
      {
        ngoId: chanduNgo._id,
        name: 'Kiwi',
        species: 'Bird',
        breed: 'Cockatiel',
        age: 1,
        gender: 'Male',
        weight: 0.1,
        color: 'Yellow & Grey',
        description:
          'Kiwi whistles cheerful melodies every morning and enjoys millet treats and out-of-cage perch time.',
        personality: ['Musical', 'Social', 'Gentle'],
        location: 'Bengaluru, Karnataka',
        images: [
          { url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'Avian wellness exam normal; clean beak and feathers.',
        vaccinationRecords: {
          isVaccinated: false,
          summary: 'Avian health screening & parasite prophylaxis completed.',
          vaccines: [],
        },
        sterilizationStatus: 'Not Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Arjun Menon', clinicName: 'Avian & Exotic Care', clinicPhone: '+91 80 23344556' },
        adoptionStatus: 'Available',
      },
      {
        ngoId: chanduNgo._id,
        name: 'Daisy',
        species: 'Dog',
        breed: 'Labrador Retriever',
        age: 3.5,
        gender: 'Female',
        weight: 28,
        color: 'Chocolate',
        description:
          'Daisy is a loving, calm Chocolate Labrador who enjoys gentle strolls and family companionship.',
        personality: ['Loving', 'Obedient', 'Calm'],
        location: 'Bengaluru, Karnataka',
        images: [
          { url: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?auto=format&fit=crop&w=900&q=80' },
        ],
        medicalHistory: 'Healthy adult Labrador with complete vaccination history.',
        vaccinationRecords: {
          isVaccinated: true,
          summary: 'All vaccinations current.',
          vaccines: [{ name: 'DHPPiL & Rabies', dateAdministered: new Date('2026-04-01'), nextDueDate: new Date('2027-04-01') }],
        },
        sterilizationStatus: 'Sterilized',
        healthStatus: 'Healthy',
        veterinaryInfo: { vetName: 'Dr. Siddharth Joshi', clinicName: 'Pune Pet Wellness', clinicPhone: '+91 20 25678900' },
        nextVaccinationDate: new Date('2027-04-01'),
        adoptionStatus: 'Available',
      },
    ];

    for (const p of samplePets) {
      const pet = await Pet.create(p);
      await MedicalRecord.create({
        petId: pet._id,
        veterinarianName: pet.veterinaryInfo.vetName,
        clinicName: pet.veterinaryInfo.clinicName,
        diagnosis: pet.medicalHistory,
        treatment: pet.sterilizationStatus === 'Sterilized' ? 'Sterilized & Routine Wellness Panel' : 'Routine Wellness Panel',
        vaccinationDetails: {
          vaccineName: pet.vaccinationRecords.vaccines[0]?.name || 'Wellness Screening',
          dateAdministered: pet.vaccinationRecords.vaccines[0]?.dateAdministered || new Date(),
          nextDueDate: pet.nextVaccinationDate,
        },
        nextVisitDate: pet.nextVaccinationDate,
      });
    }

    await AuditLog.create({
      userId: adminUser._id,
      action: 'DATABASE_SEEDED',
      resourceType: 'System',
      metadata: { petsCount: samplePets.length },
    });

    console.log('\nSeed completed successfully!');
    console.log('Seeded Accounts (Password for all: Password123!):');
    console.log('  Admin (Balaji): balaji@gmail.com');
    console.log('  NGO (Chandu):   chandu@gmail.com (Verified)');
    console.log('  Adopters:       None pre-seeded — register your own adopter via /register!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seedData();
