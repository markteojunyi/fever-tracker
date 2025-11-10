// ============================================
// FILE: app/page.tsx
// Main dashboard - now using real API calls
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
import { calculateTrend } from '@/lib/utils';

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');

  const [temperatures, setTemperatures] = useState<TemperatureReading[]>([]);
  const [medications, setMedications] = useState<MedicationDefinition[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);

  const [temperaturePreference, setTemperaturePreference] = useState<'C' | 'F'>('C');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch children
        const childRes = await fetch('/api/children');
        if (!childRes.ok) throw new Error('Failed to fetch children');
        const childData = await childRes.json();
        setChildren(childData);

        if (childData.length > 0) {
          const firstChildId = childData[0]._id;
          setSelectedChildId(firstChildId);

          // Fetch temperatures for first child
          const tempRes = await fetch(`/api/temperatures?childId=${firstChildId}`);
          if (tempRes.ok) {
            const tempData = await tempRes.json();
            setTemperatures(tempData);
          }

          // Fetch medications for first child
          const medRes = await fetch(`/api/medications?childId=${firstChildId}&isActive=true`);
          if (medRes.ok) {
            const medData = await medRes.json();
            setMedications(medData);
          }

          // Fetch medication logs for first child
          const logsRes = await fetch(`/api/medication-logs?childId=${firstChildId}`);
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            setMedicationLogs(logsData);
          }
        }
      } catch (err) {
        setError('Error loading data. Make sure MongoDB is connected.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data when child is selected
  useEffect(() => {
    if (!selectedChildId) return;

    const fetchChildData = async () => {
      try {
        // Fetch temperatures
        const tempRes = await fetch(`/api/temperatures?childId=${selectedChildId}`);
        if (tempRes.ok) {
          const tempData = await tempRes.json();
          setTemperatures(tempData);
        }

        // Fetch medications
        const medRes = await fetch(`/api/medications?childId=${selectedChildId}&isActive=true`);
        if (medRes.ok) {
          const medData = await medRes.json();
          setMedications(medData);
        }

        // Fetch medication logs
        const logsRes = await fetch(`/api/medication-logs?childId=${selectedChildId}`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setMedicationLogs(logsData);
        }
      } catch (err) {
        console.error('Error fetching child data:', err);
      }
    };

    fetchChildData();
  }, [selectedChildId]);

  // Get current child
  const currentChild = children.find((c) => c._id === selectedChildId);

  // Get temps for current child
  const childTemps = temperatures;

  // Get medications for current child
  const activeMeds = medications;

  // Get logs for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logsToday = medicationLogs.filter((log) => {
    const logDate = new Date(log.administeredAt);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  // Calculate trend
  const trend = calculateTrend(childTemps);

  // Handle adding temperature
  const handleAddTemperature = async (reading: Omit<TemperatureReading, '_id'>) => {
    try {
      const res = await fetch('/api/temperatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          temperature: reading.temperature,
          temperatureUnit: reading.temperatureUnit,
          timestamp: reading.timestamp,
          notes: reading.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to save temperature');

      const newReading = await res.json();
      setTemperatures([...temperatures, newReading]);
      alert('✅ Temperature logged successfully!');
    } catch (err) {
      alert('❌ Error saving temperature');
      console.error(err);
    }
  };

  // Handle adding medication log
  const handleAddMedicationLog = async (log: Omit<MedicationLog, '_id'>) => {
    try {
      const res = await fetch('/api/medication-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationDefinitionId: log.medicationDefinitionId,
          childId: selectedChildId,
          administeredAt: log.administeredAt,
          dosageAdministered: log.dosageAdministered,
          dosageUnit: log.dosageUnit,
          administeredBy: log.administeredBy,
        }),
      });

      if (!res.ok) throw new Error('Failed to save medication log');

      const newLog = await res.json();
      setMedicationLogs([...medicationLogs, newLog]);
      alert('✅ Medication logged successfully!');
    } catch (err) {
      alert('❌ Error saving medication');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="bg-gray-100 min-h-screen pb-8">
        <header className="bg-blue-600 text-white p-4 sticky top-0 shadow">
          <h1 className="text-2xl font-bold">🌡️ Fever Tracker</h1>
        </header>
        <div className="max-w-2xl mx-auto p-4 text-center mt-8">
          <p className="text-xl">Loading...</p>
        </div>
      </main>
    );
  }

  if (children.length === 0) {
    return (
      <main className="bg-gray-100 min-h-screen pb-8">
        <header className="bg-blue-600 text-white p-4 sticky top-0 shadow">
          <h1 className="text-2xl font-bold">🌡️ Fever Tracker</h1>
        </header>
        <div className="max-w-2xl mx-auto p-4 text-center mt-8">
          <p className="text-xl text-red-600 font-bold">❌ No children found</p>
          <p className="text-gray-600 mt-2">Please add a child first in the database.</p>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </main>
    );
  }

  if (!currentChild) {
    return <div className="p-4 text-center">No child selected</div>;
  }

  return (
    <main className="bg-gray-100 min-h-screen pb-8">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 shadow">
        <h1 className="text-2xl font-bold">🌡️ Fever Tracker</h1>
        <p className="text-sm opacity-90">Track temperature & medication for your child</p>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 font-bold">⚠️ Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

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
        <MedicationHistory logs={medicationLogs} medications={activeMeds} />

        {/* Settings Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-3 text-black">Settings</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-black">Temperature Unit:</label>
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