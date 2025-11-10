// ============================================
// FILE: app/page.tsx
// Main dashboard page - integrates all components
// ============================================

'use client';

import { useState, useEffect } from 'react';
import ChildSelector from './components/ChildSelector';
import StatusCard from './components/StatusCard';
import TemperatureEntry from './components/TemperatureEntry';
import TemperatureGraph from './components/TemperatureGraph';
import MedicationEntry from './components/MedicationEntry';
import MedicationHistory from './components/MedicationHistory';
import {
  Child,
  TemperatureReading,
  MedicationDefinition,
  MedicationLog,
  TemperatureTrend,
} from '@/lib/types';
import { mockChildren, mockTemperatures, mockMedications, mockMedicationLogs } from '@/lib/mockData';
import { calculateTrend } from '@/lib/utils';

export default function Home() {
  const [children, setChildren] = useState<Child[]>(mockChildren);
  const [selectedChildId, setSelectedChildId] = useState(mockChildren[0]?.id || '');

  const [temperatures, setTemperatures] = useState<TemperatureReading[]>(mockTemperatures);
  const [medications, setMedications] = useState<MedicationDefinition[]>(mockMedications);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>(mockMedicationLogs);

  const [temperaturePreference, setTemperaturePreference] = useState<'C' | 'F'>('C');

  // Get current child
  const currentChild = children.find((c) => c.id === selectedChildId);

  // Get temps for current child
  const childTemps = temperatures.filter((t) => t.childId === selectedChildId);

  // Get medications for current child
  const activeMeds = medications.filter((m) => m.childId === selectedChildId && m.isActive);

  // Get logs for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logsToday = medicationLogs.filter((log) => {
    const logDate = new Date(log.administeredAt);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime() && log.childId === selectedChildId;
  });

  // Calculate trend
  const trend = calculateTrend(childTemps);

  // Handle adding temperature
  const handleAddTemperature = (reading: TemperatureReading) => {
    setTemperatures([...temperatures, reading]);
    alert('✅ Temperature logged successfully!');
  };

  // Handle adding medication log
  const handleAddMedicationLog = (log: MedicationLog) => {
    setMedicationLogs([...medicationLogs, log]);
    alert('✅ Medication logged successfully!');
  };

  if (!currentChild) {
    return <div className="p-4 text-center">No child found</div>;
  }

  return (
    <main className="bg-gray-100 min-h-screen pb-8">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 shadow">
        <h1 className="text-2xl font-bold">🌡️ Fever Tracker</h1>
        <p className="text-sm opacity-90">Track temperature & medication for your child</p>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Child Selector */}
        <ChildSelector
          children={children}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
        />

        {/* Temperature Status Card */}
        <StatusCard trend={trend} unit={temperaturePreference} />

        {/* Alerts */}
        {trend.currentTemp > 39 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 font-bold">🚨 HIGH FEVER ALERT</p>
            <p className="text-sm text-red-600">
              Temperature is {trend.currentTemp.toFixed(1)}°{temperaturePreference}. Consider contacting a doctor.
            </p>
          </div>
        )}

        {trend.trend === 'worsening' && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-700 font-bold">⚠️ FEVER WORSENING</p>
            <p className="text-sm text-orange-600">Temperature is trending upward. Monitor closely.</p>
          </div>
        )}

        {/* Temperature Entry Form */}
        <TemperatureEntry childId={selectedChildId} onAddTemperature={handleAddTemperature} />

        {/* Temperature Graph */}
        <TemperatureGraph readings={childTemps} unit={temperaturePreference} />

        {/* Medication Entry Form */}
        <MedicationEntry
          childId={selectedChildId}
          medications={activeMeds}
          logsToday={logsToday}
          onAddLog={handleAddMedicationLog}
        />

        {/* Medication History */}
        <MedicationHistory logs={medicationLogs.filter((l) => l.childId === selectedChildId)} medications={activeMeds} />

        {/* Settings Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-3">Settings</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Temperature Unit:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTemperaturePreference('C')}
                className={`px-4 py-2 rounded font-semibold ${
                  temperaturePreference === 'C'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setTemperaturePreference('F')}
                className={`px-4 py-2 rounded font-semibold ${
                  temperaturePreference === 'F'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}