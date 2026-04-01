"use client";

import { useState } from "react";
import { addChild } from "@/lib/services/feverApi";
import type { Child } from "@/lib/types";
import AppHeader from "./AppHeader";
import Toast from "./Toast";

interface Props {
  onChildAdded: (child: Child) => void;
  onSignOut: () => void;
  dbError?: string;
}

export default function NewRecordForm({ onChildAdded, onSignOut, dbError }: Props) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [weight, setWeight] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) {
      setToast({ message: "Please fill in name and date of birth", type: "error" });
      return;
    }
    setAdding(true);
    try {
      const newChild = await addChild({
        name,
        dateOfBirth: dob,
        weight: weight ? parseFloat(weight) : undefined,
      });
      onChildAdded(newChild);
    } catch {
      setToast({ message: "Error creating record", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="bg-slate-50 min-h-screen pb-8">
      <AppHeader onSignOut={onSignOut} />

      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            New Illness Record
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            e.g., &quot;Emma - Flu Jan 2026&quot;
          </p>

          {dbError && (
            <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              {dbError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Record Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Emma - Flu Jan 2026"
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
                value={dob}
                onChange={(e) => setDob(e.target.value)}
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
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 18"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors"
              style={{ color: "#ffffff" }}
            >
              {adding ? "Creating..." : "Create Record"}
            </button>
          </form>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </main>
  );
}
