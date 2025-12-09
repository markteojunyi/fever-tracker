export interface Child {
  _id?: string;
  id?: string;
  name: string;
  dateOfBirth: string;
  weight?: number;
  createdAt: string;
}

export interface TemperatureReading {
  _id?: string;
  id?: string;
  childId: string;
  temperature: number;
  temperatureUnit: 'C' | 'F';
  timestamp: string;
  notes?: string;
  createdAt: string;
}

export interface MedicationDefinition {
  _id?: string;
  id?: string;
  childId: string;
  name: string;
  dosage: number;
  dosageUnit: 'pills/tablets' | 'ml';
  frequency: number;
  maxDosesPerDay: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationLog {
  _id?: string;
  id?: string;
  medicationDefinitionId: string;
  childId: string;
  administeredAt: string;
  dosageAdministered: number;
  dosageUnit: 'mg' | 'ml';
  administeredBy: string;
  createdAt: string;
}

export interface TemperatureTrend {
  currentTemp: number;
  peakTemp: number;
  lowestTemp: number;
  trend: 'improving' | 'worsening' | 'stable';
  trendDirection: 'up' | 'down' | 'flat';
  avgTempLast24h: number;
  readings: Array<{
    timestamp: string;
    temperature: number;
    unit: 'C' | 'F';
  }>;
}