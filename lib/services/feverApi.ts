import type {
  Child,
  TemperatureReading,
  MedicationDefinition,
  MedicationLog,
  Observation,
} from "@/lib/types";

// Private helper — throws on non-OK responses so callers don't repeat that check
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ─── Children ────────────────────────────────────────────────────────────────

export const getChildren = (): Promise<Child[]> =>
  apiFetch("/api/children");

export const addChild = (data: {
  name: string;
  dateOfBirth: string;
  weight?: number;
}): Promise<Child> => apiFetch("/api/children", json(data));

export const renameChild = (id: string, name: string): Promise<void> =>
  apiFetch(`/api/children?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

export const deleteChild = (id: string): Promise<void> =>
  apiFetch(`/api/children?id=${id}`, { method: "DELETE" });

// ─── Temperatures ─────────────────────────────────────────────────────────────

export const getTemperatures = (childId: string): Promise<TemperatureReading[]> =>
  apiFetch(`/api/temperatures?childId=${childId}`);

export const addTemperature = (
  data: Omit<TemperatureReading, "_id" | "id" | "createdAt">
): Promise<TemperatureReading> => apiFetch("/api/temperatures", json(data));

export const deleteTemperature = (id: string): Promise<void> =>
  apiFetch(`/api/temperatures?id=${id}`, { method: "DELETE" });

// ─── Medications ─────────────────────────────────────────────────────────────

export const getMedications = (childId: string): Promise<MedicationDefinition[]> =>
  apiFetch(`/api/medications?childId=${childId}&isActive=true`);

export const getMedicationLogs = (childId: string): Promise<MedicationLog[]> =>
  apiFetch(`/api/medication-logs?childId=${childId}`);

export const addMedicationLog = (
  data: Omit<MedicationLog, "_id" | "id" | "createdAt">
): Promise<MedicationLog> => apiFetch("/api/medication-logs", json(data));

export const deleteMedicationLog = (id: string): Promise<void> =>
  apiFetch(`/api/medication-logs?id=${id}`, { method: "DELETE" });

// ─── Observations ─────────────────────────────────────────────────────────────

export const getObservations = (childId: string): Promise<Observation[]> =>
  apiFetch(`/api/observations?childId=${childId}`);

export const addObservation = (
  childId: string,
  content: string
): Promise<Observation> => apiFetch("/api/observations", json({ childId, content }));

export const deleteObservation = (id: string): Promise<void> =>
  apiFetch(`/api/observations?id=${id}`, { method: "DELETE" });
