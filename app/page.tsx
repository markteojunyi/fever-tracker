// ============================================
// FILE: app/page.tsx
// Main dashboard with Add Child form
// ============================================

'use client';

import { useState, useEffect } from 'react';
import ChildSelector from './components/ChildSelector';
import StatusCard from './components/StatusCard';
import TemperatureEntry from './components/TemperatureEntry';
import TemperatureGraph from './components/TemperatureGraph';
import MedicationEntry from './components/MedicationEntry';
import MedicationHistory from './components/MedicationHistory';
import AddMedicationForm from './components/AddMedicationForm';
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

  // Add Child Form State
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDOB, setNewChildDOB] = useState('');
  const [newChildWeight, setNewChildWeight] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false);

  // Fetch all children on mount
  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError('');

      const childRes = await fetch('/api/children');
      if (!childRes.ok) throw new Error('Failed to fetch children');
      const childData = await childRes.json();
      setChildren(childData);

      if (childData.length > 0) {
        const firstChildId = childData[0]._id;
        setSelectedChildId(firstChildId);
        await fetchChildData(firstChildId);
      } else {
        setShowAddChildForm(true);
      }
    } catch (err) {
      setError('Error loading data. Make sure MongoDB is connected.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId: string) => {
    try {
      if (!childId) return;
      
      const tempRes = await fetch(`/api/temperatures?childId=${childId}`);
      if (tempRes.ok) {
        const tempData = await tempRes.json();
        setTemperatures(tempData);
      }

      if (!selectedChildId) return;

      const medRes = await fetch(`/api/medications?childId=${childId}&isActive=true`);
      if (medRes.ok) {
        const medData = await medRes.json();
        setMedications(medData);
      }

      const logsRes = await fetch(`/api/medication-logs?childId=${childId}`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setMedicationLogs(logsData);
      }
    } catch (err) {
      console.error('Error fetching child data:', err);
    }
  };

  // Refresh data when child is selected
  useEffect(() => {
    if (!selectedChildId) return;
    fetchChildData(selectedChildId);
  }, [selectedChildId]);

  // Handle Add Child
  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChildName || !newChildDOB) {
      alert('Please fill in name and date of birth');
      return;
    }

    setAddingChild(true);

    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChildName,
          dateOfBirth: newChildDOB,
          weight: newChildWeight ? parseFloat(newChildWeight) : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to add child');

      const newChild = await res.json();
      setChildren([...children, newChild]);
      setSelectedChildId(newChild._id);
      setShowAddChildForm(false);
      setNewChildName('');
      setNewChildDOB('');
      setNewChildWeight('');
      alert('✅ Child added successfully!');
    } catch (err) {
      alert('❌ Error adding child');
      console.error(err);
    } finally {
      setAddingChild(false);
    }
  };

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
    console.log('=== BEFORE LOGGING ===');
    console.log('selectedChildId:', selectedChildId);
    console.log('activeMeds:', activeMeds);
    
    
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

    // Add the new delete function RIGHT HERE, after handleAddMedicationLog
  const handleDeleteMedicationLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/medication-logs?id=${logId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete log');
      }

      // Update state to remove the deleted log
      setMedicationLogs(medicationLogs.filter(log => log._id !== logId));
      alert('✅ Medication log deleted successfully!');
    } catch (err) {
      alert('❌ Error deleting medication log');
      console.error(err);
    }
  };

  const currentChild = children.find((c) => c._id === selectedChildId);
  const childTemps = temperatures;
  const activeMeds = medications;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logsToday = medicationLogs.filter((log) => {
    const logDate = new Date(log.administeredAt);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });



  const trend = calculateTrend(childTemps);

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

  // Show Add Child Form if no children exist
  if (children.length === 0 || showAddChildForm) {
    return (
      <main className="bg-gray-100 min-h-screen pb-8">
        <header className="bg-blue-600 text-white p-4 sticky top-0 shadow">
          <h1 className="text-2xl font-bold">🌡️ Fever Tracker</h1>
          <p className="text-sm opacity-90">Track temperature & medication for your child</p>
        </header>

        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-black">Add Your Child</h2>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-black">Child's Name:</label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="e.g., Emma"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-black">Date of Birth:</label>
                <input
                  type="date"
                  value={newChildDOB}
                  onChange={(e) => setNewChildDOB(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-black">Weight (kg) - Optional:</label>
                <input
                  type="number"
                  step="0.1"
                  value={newChildWeight}
                  onChange={(e) => setNewChildWeight(e.target.value)}
                  placeholder="e.g., 18"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={addingChild}
                className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {addingChild ? 'Adding...' : 'Add Child'}
              </button>
            </form>

            {error && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-bold">⚠️ Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!currentChild) {
    return <div className="p-4 text-center">No child selected</div>;
  }

      console.log('=== RENDER CHECK ===');
      console.log('selectedChildId:', selectedChildId);
      console.log('activeMeds:', activeMeds);
      console.log('activeMeds.length:', activeMeds.length);
      console.log('Should MedicationEntry show?', activeMeds.length > 0);

    return (
    <main className="bg-gray-100 min-h-screen pb-8">
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

        <ChildSelector
          children={children}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
        />

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowAddChildForm(true)}
            className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600"
          >
            + Add Another Child
          </button>
        </div>

        <StatusCard trend={trend} unit={temperaturePreference} />

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

        <TemperatureEntry childId={selectedChildId} onAddTemperature={handleAddTemperature} />

        <TemperatureGraph readings={childTemps} unit={temperaturePreference} />

        <MedicationEntry
          childId={selectedChildId}
          medications={activeMeds}
          logsToday={logsToday}
          onAddLog={handleAddMedicationLog}
        />

        {activeMeds.length === 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-700 font-bold mb-2">ℹ️ No Active Medications</p>
            <p className="text-sm text-blue-600 mb-3">Add a medication to track dosages and set reminders.</p>
            <button
              onClick={() => setShowAddMedicationForm(true)}
              className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600"
            >
              + Add First Medication
            </button>
          </div>
        )}



        {/* There is this missing section that claude can't seem to figure out. I need a button here!
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowAddMedicationForm(true)}
            className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600"
          >
            + Add Another Medication
          </button>
        </div>
        */}

        <MedicationHistory 
          logs={medicationLogs} 
          medications={activeMeds} 
          onDeleteLog={handleDeleteMedicationLog}
        />

        {activeMeds.length > 0 && (
          <button
            onClick={() => setShowAddMedicationForm(true)}
            className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 mb-4"
          >
            + Add Another Medication
          </button>
        )}
      </div>

        {showAddMedicationForm && (
        <AddMedicationForm
          childId={selectedChildId}
          onMedicationAdded={(newMed) => {
            if (!selectedChildId) return;
            
            setShowAddMedicationForm(false);
            
            // Refresh medications from database
            const medRes = fetch(`/api/medications?childId=${selectedChildId}&isActive=true`);
            medRes.then(res => {
              if (res.ok) {
                return res.json();
              }
            }).then(medData => {
              if (medData) {
                setMedications(medData);
              }
            });
          }}
          onClose={() => setShowAddMedicationForm(false)}
        />
      )}
    </main>
  );
}