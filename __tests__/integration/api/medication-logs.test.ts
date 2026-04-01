import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

import { GET, POST, DELETE } from "@/app/api/medication-logs/route";
import Child from "@/lib/models/Child";
import MedicationDefinition from "@/lib/models/MedicationDefinition";
import MedicationLog from "@/lib/models/MedicationLog";
import { startTestDB, stopTestDB, clearTestDB } from "@/tests/helpers/db";
import { get, post, del } from "@/tests/helpers/request";

let mongod: MongoMemoryServer;
let childId: string;
let medDefId: string;

beforeAll(async () => { mongod = await startTestDB(); });
afterAll(async () => { await stopTestDB(mongod); });
beforeEach(async () => {
  await clearTestDB();
  const child = await Child.create({ name: "Emma", dateOfBirth: new Date("2019-01-01") });
  childId = child._id.toString();
  const med = await MedicationDefinition.create({
    childId, name: "Paracetamol", dosage: 5, dosageUnit: "ml",
    frequency: 6, maxDosesPerDay: 4, startDate: new Date("2025-01-01"), isActive: true,
  });
  medDefId = med._id.toString();
});

function logPayload(overrides = {}) {
  return {
    medicationDefinitionId: medDefId,
    childId,
    administeredAt: new Date().toISOString(),
    dosageAdministered: 5,
    dosageUnit: "ml",
    administeredBy: "Mom",
    ...overrides,
  };
}

// ─── GET /api/medication-logs ─────────────────────────────────────────────────

describe("GET /api/medication-logs", () => {
  it("returns an empty array when no logs exist", async () => {
    const body = await (await GET(get(`/api/medication-logs?childId=${childId}`))).json();
    expect(body).toEqual([]);
  });

  it("returns logs for the specified child sorted by administeredAt descending", async () => {
    await MedicationLog.create({ ...logPayload(), administeredAt: new Date("2025-01-16T08:00:00Z") });
    await MedicationLog.create({ ...logPayload(), administeredAt: new Date("2025-01-16T14:00:00Z") });

    const body = await (await GET(get(`/api/medication-logs?childId=${childId}`))).json();
    expect(body).toHaveLength(2);
    // Most recent first
    expect(new Date(body[0].administeredAt) > new Date(body[1].administeredAt)).toBe(true);
  });

  it("does not return logs for a different child", async () => {
    const other = await Child.create({ name: "Other", dateOfBirth: new Date("2020-01-01") });
    await MedicationLog.create({ ...logPayload(), childId: other._id });

    const body = await (await GET(get(`/api/medication-logs?childId=${childId}`))).json();
    expect(body).toHaveLength(0);
  });

  it("filters logs by date when the date param is provided", async () => {
    await MedicationLog.create({ ...logPayload(), administeredAt: new Date("2025-01-16T10:00:00") });
    await MedicationLog.create({ ...logPayload(), administeredAt: new Date("2025-01-17T10:00:00") });

    const body = await (
      await GET(get(`/api/medication-logs?childId=${childId}&date=2025-01-16`))
    ).json();
    expect(body).toHaveLength(1);
    expect(new Date(body[0].administeredAt).getDate()).toBe(16);
  });
});

// ─── POST /api/medication-logs ────────────────────────────────────────────────

describe("POST /api/medication-logs", () => {
  it("creates a log and returns 201", async () => {
    const res = await POST(post("/api/medication-logs", logPayload()));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body._id).toBeTruthy();
    expect(body.administeredBy).toBe("Mom");
  });

  it("persists the log to the database", async () => {
    await POST(post("/api/medication-logs", logPayload({ administeredBy: "Dad" })));
    const found = await MedicationLog.findOne({ administeredBy: "Dad" });
    expect(found).not.toBeNull();
  });

  it("saves optional notes when provided", async () => {
    const res = await POST(post("/api/medication-logs", logPayload({ notes: "With food" })));
    expect((await res.json()).notes).toBe("With food");
  });

  it("returns 500 when required fields are missing", async () => {
    const res = await POST(post("/api/medication-logs", { childId }));
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/medication-logs ──────────────────────────────────────────────

describe("DELETE /api/medication-logs", () => {
  it("deletes a log and returns 200", async () => {
    const log = await MedicationLog.create(logPayload());
    const res = await DELETE(del(`/api/medication-logs?id=${log._id}`));
    expect(res.status).toBe(200);
  });

  it("removes the log from the database", async () => {
    const log = await MedicationLog.create(logPayload());
    await DELETE(del(`/api/medication-logs?id=${log._id}`));
    expect(await MedicationLog.findById(log._id)).toBeNull();
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(del("/api/medication-logs"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the log does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await DELETE(del(`/api/medication-logs?id=${fakeId}`));
    expect(res.status).toBe(404);
  });
});
