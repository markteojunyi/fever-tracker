"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import * as feverApi from "@/lib/services/feverApi";
import { calculateTrend } from "@/lib/utils";
import type {
  Child,
  TemperatureReading,
  MedicationDefinition,
  MedicationLog,
  Observation,
} from "@/lib/types";

// Components
import AppHeader from "./components/AppHeader";
import SectionHeader from "./components/SectionHeader";
import FeverAlerts from "./components/FeverAlerts";
import NewRecordForm from "./components/NewRecordForm";
import ChildSelector from "./components/ChildSelector";
import StatusCard from "./components/StatusCard";
import TemperatureEntry from "./components/TemperatureEntry";
import TemperatureGraph from "./components/TemperatureGraph";
import MedicationEntry from "./components/MedicationEntry";
import MedicationHistory from "./components/MedicationHistory";
import AddMedicationForm from "./components/AddMedicationForm";
import ObservationLog from "./components/ObservationLog";
import Toast from "./components/Toast";

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [temperatures, setTemperatures] = useState<TemperatureReading[]>([]);
  const [medications, setMedications] = useState<MedicationDefinition[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  const [temperaturePreference] = useState<"C" | "F">("C");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [justAddedChild, setJustAddedChild] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  // ─── Template Method: common try/toast/catch skeleton ────────────────────
  const executeAction = useCallback(
    async (
      action: () => Promise<void>,
      successMsg: string,
      errorMsg: string
    ) => {
      try {
        await action();
        showToast(successMsg, "success");
      } catch (err) {
        showToast(errorMsg, "error");
        console.error(err);
      }
    },
    [showToast]
  );

  // ─── Bootstrap ───────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        setError("");
        const childData = await feverApi.getChildren();
        setChildren(childData);
        if (childData.length > 0) {
          const firstId = childData[0]._id!;
          setSelectedChildId(firstId);
          await loadChildData(firstId);
        } else {
          setShowAddChildForm(true);
        }
      } catch {
        setError("Error loading data. Make sure MongoDB is connected.");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChildData = async (childId: string) => {
    const [temps, meds, logs, obs] = await Promise.allSettled([
      feverApi.getTemperatures(childId),
      feverApi.getMedications(childId),
      feverApi.getMedicationLogs(childId),
      feverApi.getObservations(childId),
    ]);
    if (temps.status === "fulfilled") setTemperatures(temps.value);
    if (meds.status === "fulfilled") setMedications(meds.value);
    if (logs.status === "fulfilled") setMedicationLogs(logs.value);
    if (obs.status === "fulfilled") setObservations(obs.value);
  };

  useEffect(() => {
    if (!selectedChildId) return;
    loadChildData(selectedChildId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  // ─── Handlers (Facade + Template Method) ─────────────────────────────────

  const handleChildAdded = (newChild: Child) => {
    setChildren((prev) => [...prev, newChild]);
    setSelectedChildId(newChild._id!);
    setShowAddChildForm(false);
    setJustAddedChild(newChild.name);
    showToast("Record created", "success");
  };

  const handleDeleteRecord = (id: string) =>
    executeAction(async () => {
      await feverApi.deleteChild(id);
      const remaining = children.filter((c) => c._id !== id);
      setChildren(remaining);
      if (remaining.length > 0) {
        setSelectedChildId(remaining[0]._id!);
      } else {
        setShowAddChildForm(true);
      }
    }, "Illness record deleted", "Error deleting record");

  const handleRenameRecord = (id: string, newName: string) =>
    executeAction(async () => {
      await feverApi.renameChild(id, newName);
      setChildren((prev) =>
        prev.map((c) => (c._id === id ? { ...c, name: newName } : c))
      );
    }, "Record renamed", "Error renaming record");

  const handleAddTemperature = (reading: Omit<TemperatureReading, "_id">) =>
    executeAction(async () => {
      const newReading = await feverApi.addTemperature({
        ...reading,
        childId: selectedChildId,
      });
      setTemperatures((prev) => [...prev, newReading]);
    }, "Temperature logged", "Error saving temperature");

  const handleDeleteTemperature = (id: string) =>
    executeAction(async () => {
      await feverApi.deleteTemperature(id);
      setTemperatures((prev) => prev.filter((t) => t._id !== id));
    }, "Reading deleted", "Error deleting reading");

  const handleAddMedicationLog = (log: Omit<MedicationLog, "_id">) =>
    executeAction(async () => {
      const newLog = await feverApi.addMedicationLog({
        ...log,
        childId: selectedChildId,
      });
      setMedicationLogs((prev) => [...prev, newLog]);
    }, "Medication logged", "Error saving medication");

  const handleDeleteMedicationLog = (id: string) =>
    executeAction(async () => {
      await feverApi.deleteMedicationLog(id);
      setMedicationLogs((prev) => prev.filter((l) => l._id !== id));
    }, "Medication log deleted", "Error deleting medication log");

  const handleAddObservation = (content: string) =>
    executeAction(async () => {
      const newObs = await feverApi.addObservation(selectedChildId, content);
      setObservations((prev) => [newObs, ...prev]);
    }, "Observation logged", "Error saving observation");

  const handleDeleteObservation = (id: string) =>
    executeAction(async () => {
      await feverApi.deleteObservation(id);
      setObservations((prev) => prev.filter((o) => o._id !== id));
    }, "Observation deleted", "Error deleting observation");

  // ─── Derived state ────────────────────────────────────────────────────────
  const currentChild = children.find((c) => c._id === selectedChildId);
  const trend = calculateTrend(temperatures);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logsToday = medicationLogs.filter((log) => {
    const d = new Date(log.administeredAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const handleSignOut = () => signOut({ callbackUrl: "/login" });

  // ─── Render guards ────────────────────────────────────────────────────────
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
      <NewRecordForm
        onChildAdded={handleChildAdded}
        onSignOut={handleSignOut}
        dbError={error}
      />
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

  // ─── Main dashboard ───────────────────────────────────────────────────────
  return (
    <main className="bg-slate-50 min-h-screen pb-12">
      <AppHeader onSignOut={handleSignOut} />

      <div className="max-w-6xl mx-auto px-4 pt-4">
        {error && (
          <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Record selector */}
        <div className="flex items-center gap-2 mb-2">
          <ChildSelector
            selectedChildId={selectedChildId}
            onSelectChild={setSelectedChildId}
            onDeleteRecord={handleDeleteRecord}
            onRenameRecord={handleRenameRecord}
          >
            {children}
          </ChildSelector>
          <button
            onClick={() => setShowAddChildForm(true)}
            className="shrink-0 text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-full px-3 py-1.5 font-medium transition-colors"
          >
            + New record
          </button>
        </div>

        {/* Welcome banner */}
        {justAddedChild && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-3 flex justify-between items-start">
            <div>
              <p className="text-indigo-700 font-semibold text-sm">
                {justAddedChild} has been added!
              </p>
              <p className="text-indigo-500 text-xs mt-0.5">
                Start by logging a temperature reading below.
              </p>
            </div>
            <button
              onClick={() => setJustAddedChild("")}
              className="text-indigo-300 hover:text-indigo-500 text-lg leading-none ml-4"
            >
              ×
            </button>
          </div>
        )}

        <FeverAlerts trend={trend} unit={temperaturePreference} />

        <SectionHeader label="Status" />
        <StatusCard trend={trend} unit={temperaturePreference} />

        {/* Two-column grid on desktop */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left: Temperature */}
          <div>
            <SectionHeader label="Temperature" />
            <TemperatureEntry
              childId={selectedChildId}
              onAddTemperature={handleAddTemperature}
            />
            <TemperatureGraph
              readings={temperatures}
              unit={temperaturePreference}
              onDeleteReading={handleDeleteTemperature}
            />
          </div>

          {/* Right: Medications */}
          <div>
            <SectionHeader label="Medications" />
            {medications.length === 0 ? (
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
                  medications={medications}
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
              medications={medications}
              onDeleteLog={handleDeleteMedicationLog}
            />
          </div>
        </div>

        {/* Observations */}
        <SectionHeader label="Observations" />
        <ObservationLog
          observations={observations}
          onAdd={handleAddObservation}
          onDelete={handleDeleteObservation}
        />
      </div>

      {showAddMedicationForm && (
        <AddMedicationForm
          childId={selectedChildId}
          onMedicationAdded={() => {
            setShowAddMedicationForm(false);
            feverApi
              .getMedications(selectedChildId)
              .then(setMedications)
              .catch(console.error);
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
