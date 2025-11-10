import { v4 as uuidv4 } from 'uuid';
import { Child, TemperatureReading, MedicationDefinition, MedicationLog } from './types';

const childId = uuidv4();

export const mockChildren: Child[] = [
  {
    id: childId,
    name: 'Emma',
    dateOfBirth: '2020-05-15',
    weight: 18,
    createdAt: new Date().toISOString(),
  },
];

export const mockTemperatures: TemperatureReading[] = [
  {
    id: uuidv4(),
    childId,
    temperature: 36.5,
    temperatureUnit: 'C',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    childId,
    temperature: 37.8,
    temperatureUnit: 'C',
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    childId,
    temperature: 38.5,
    temperatureUnit: 'C',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    childId,
    temperature: 38.2,
    temperatureUnit: 'C',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    childId,
    temperature: 37.5,
    temperatureUnit: 'C',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const mockMedications: MedicationDefinition[] = [
  {
    id: uuidv4(),
    childId,
    name: 'Paracetamol',
    dosage: 250,
    dosageUnit: 'mg',
    frequency: 6,
    maxDosesPerDay: 4,
    startDate: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const mockMedicationLogs: MedicationLog[] = [
  {
    id: uuidv4(),
    medicationDefinitionId: mockMedications[0].id,
    childId,
    administeredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    dosageAdministered: 250,
    dosageUnit: 'mg',
    administeredBy: 'Mom',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    medicationDefinitionId: mockMedications[0].id,
    childId,
    administeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    dosageAdministered: 250,
    dosageUnit: 'mg',
    administeredBy: 'Dad',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];