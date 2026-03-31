"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import ChildSelector from "./components/ChildSelector";
import StatusCard from "./components/StatusCard";
import TemperatureEntry from "./components/TemperatureEntry";
import TemperatureGraph from "./components/TemperatureGraph";
import MedicationEntry from "./components/MedicationEntry";
import MedicationHistory from "./components/MedicationHistory";
import AddMedicationForm from "./components/AddMedicationForm";
import Toast from "./components/Toast";
import {
  Child,
  TemperatureReading,
  MedicationDefinition,
  MedicationLog,
} from "@/lib/types";
import { calculateTrend } from "@/lib/utils";

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function AppHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="bg-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#ffffff" }}>
            🌡️ Fever Tracker
          </h1>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Temperature & medication log
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="text-sm border border-slate-600 rounded-lg px-3 py-1.5 transition-colors hover:border-slate-400"
          style={{ color: "#cbd5e1" }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  const [temperatures, setTemperatures] = useState<TemperatureReading[]>([]);
  const [medications, setMedications] = useState<MedicationDefinition[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);

  const [temperaturePreference, setTemperaturePreference] = useState<"C" | "F">("C");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildDOB, setNewChildDOB] = useState("");
  const [newChildWeight, setNewChildWeight] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const handleSignOut = () => signOut({ callbackUrl: "/login" });

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError("");

      const childRes = await fetch("/api/children");
      if (!childRes.ok) throw new Error("Failed to fetch children");
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
      setError("Error loading data. Make sure MongoDB is connected.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId: string) => {
    try {
      if (!childId) return;

      const tempRes = await fetch(`/api/temperatures?childId=${childId}`);
      if (tempRes.ok) setTemperatures(await tempRes.json());

      const medRes = await fetch(`/api/medications?childId=${childId}&isActive=true`);
      if (medRes.ok) setMedications(await medRes.json());

      const logsRes = await fetch(`/api/medication-logs?childId=${childId}`);
      if (logsRes.ok) setMedicationLogs(await logsRes.json());
    } catch (err) {
      console.error("Error fetching child data:", err);
    }
  };

  useEffect(() => {
    if (!selectedChildId) return;
    fetchChildData(selectedChildId);
  }, [selectedChildId]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChildName || !newChildDOB) {
      showToast("Please fill in name and date of birth", "error");
      return;
    }

    setAddingChild(true);

    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChildName,
          dateOfBirth: newChildDOB,
          weight: newChildWeight ? parseFloat(newChildWeight) : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to add child");

      const newChild = await res.json();
      setChildren([...children, newChild]);
      setSelectedChildId(newChild._id);
      setShowAddChildForm(false);
      setNewChildName("");
      setNewChildDOB("");
      setNewChildWeight("");
      showToast("Child added successfully", "success");
    } catch (err) {
      showToast("Error adding child", "error");
      console.error(err);
    } finally {
      setAddingChild(false);
    }
  };

  const handleAddTemperature = async (reading: Omit<TemperatureReading, "_id">) => {
    try {
      const res = await fetch("/api/temperatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          temperature: reading.temperature,
          temperatureUnit: reading.temperatureUnit,
          timestamp: reading.timestamp,
          notes: reading.notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to save temperature");

      const newReading = await res.json();
      setTemperatures([...temperatures, newReading]);
      showToast("Temperature logged", "success");
    } catch (err) {
      showToast("Error saving temperature", "error");
      console.error(err);
    }
  };

  const handleAddMedicationLog = async (log: Omit<MedicationLog, "_id">) => {
    try {
      const res = await fetch("/api/medication-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationDefinitionId: log.medicationDefinitionId,
          childId: selectedChildId,
          administeredAt: log.administeredAt,
          dosageAdministered: log.dosageAdministered,
          dosageUnit: log.dosageUnit,
          administeredBy: log.administeredBy,
        }),
      });

      if (!res.ok) throw new Error("Failed to save medication log");

      const newLog = await res.json();
      setMedicationLogs([...medicationLogs, newLog]);
      showToast("Medication logged", "success");
    } catch (err) {
      showToast("Error saving medication", "error");
      console.error(err);
    }
  };

  const handleDeleteMedicationLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/medication-logs?id=${logId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete log");

      setMedicationLogs(medicationLogs.filter((log) => log._id !== logId));
      showToast("Medication log deleted", "success");
    } catch (err) {
      showToast("Error deleting medication log", "error");
      console.error(err);
    }
  };

  const currentChild = children.find((c) => c._id === selectedChildId);
  const activeMeds = medications;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logsToday = medicationLogs.filter((log) => {
    const logDate = new Date(log.administeredAt);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  const trend = calculateTrend(temperatures);

  if (loading) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <AppHeader onSignOut={handleSignOut} />
        <div className="max-w-2xl mx-auto p-4 text-center mt-12">
          <p className="text-slate-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (children.length === 0 || showAddChildForm) {
    return (
      <main className="bg-slate-50 min-h-screen pb-8">
        <AppHeader onSignOut={handleSignOut} />

        <div className="max-w-2xl mx-auto p-4 mt-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Add Your Child
            </h2>

            {error && (
              <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Child&apos;s Name
                </label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="e.g., Emma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={newChildDOB}
                  onChange={(e) => setNewChildDOB(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Weight (kg) — optional
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newChildWeight}
                  onChange={(e) => setNewChildWeight(e.target.value)}
                  placeholder="e.g., 18"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <button
                type="submit"
                disabled={addingChild}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors"
                style={{ color: "#ffffff" }}
              >
                {addingChild ? "Adding..." : "Add Child"}
              </button>
            </form>
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </main>
    );
  }

  if (!currentChild) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <AppHeader onSignOut={handleSignOut} />
        <div className="p-4 text-center text-slate-500">No child selected</div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen pb-12">
      <AppHeader onSignOut={handleSignOut} />

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {error && (
          <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Child selector + add child */}
        <div className="flex items-center gap-2 mb-2">
          <ChildSelector
            selectedChildId={selectedChildId}
            onSelectChild={setSelectedChildId}
          >
            {children}
          </ChildSelector>
          <button
            onClick={() => setShowAddChildForm(true)}
            className="shrink-0 text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-full px-3 py-1.5 font-medium transition-colors"
          >
            + Add child
          </button>
        </div>

        {/* Alerts */}
        {trend.currentTemp > 39 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-3">
            <p className="text-rose-700 font-bold text-sm">High Fever Alert</p>
            <p className="text-rose-600 text-xs mt-0.5">
              Temperature is {trend.currentTemp.toFixed(1)}°
              {temperaturePreference}. Consider contacting a doctor.
            </p>
          </div>
        )}

        {trend.trend === "worsening" && trend.currentTemp <= 39 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
            <p className="text-amber-700 font-bold text-sm">Fever Worsening</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Temperature is trending upward. Monitor closely.
            </p>
          </div>
        )}

        <SectionHeader label="Status" />
        <StatusCard trend={trend} unit={temperaturePreference} />

        <SectionHeader label="Temperature" />
        <TemperatureEntry
          childId={selectedChildId}
          onAddTemperature={handleAddTemperature}
        />
        <TemperatureGraph readings={temperatures} unit={temperaturePreference} />

        <SectionHeader label="Medications" />

        {activeMeds.length === 0 ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
            <p className="text-indigo-700 font-semibold text-sm mb-1">
              No active medications
            </p>
            <p className="text-indigo-500 text-xs mb-3">
              Add a medication to track dosages.
            </p>
            <button
              onClick={() => setShowAddMedicationForm(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              style={{ color: "#ffffff" }}
            >
              + Add First Medication
            </button>
          </div>
        ) : (
          <>
            <MedicationEntry
              childId={selectedChildId}
              medications={activeMeds}
              logsToday={logsToday}
              onAddLog={handleAddMedicationLog}
            />
            <button
              onClick={() => setShowAddMedicationForm(true)}
              className="w-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold py-2 px-4 rounded-lg text-sm mb-4 transition-colors"
            >
              + Add Another Medication
            </button>
          </>
        )}

        <SectionHeader label="History" />
        <MedicationHistory
          logs={medicationLogs}
          medications={activeMeds}
          onDeleteLog={handleDeleteMedicationLog}
        />
      </div>

      {showAddMedicationForm && (
        <AddMedicationForm
          childId={selectedChildId}
          onMedicationAdded={(newMed) => {
            if (!selectedChildId) return;
            setShowAddMedicationForm(false);
            fetch(`/api/medications?childId=${selectedChildId}&isActive=true`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => { if (data) setMedications(data); });
            showToast("Medication added", "success");
          }}
          onClose={() => setShowAddMedicationForm(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  );
}
