import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

import { GET, POST } from "@/app/api/reminders/route";
import { PATCH as PATCH_BY_ID } from "@/app/api/reminders/[id]/route";
import Child from "@/lib/models/Child";
import MedicationDefinition from "@/lib/models/MedicationDefinition";
import MedicationReminder from "@/lib/models/MedicationReminder";
import { startTestDB, stopTestDB, clearTestDB } from "@/tests/helpers/db";
import { get, post, patch } from "@/tests/helpers/request";

let mongod: MongoMemoryServer;
let childId: string;
let medDefId: string;

beforeAll(async () => {
  mongod = await startTestDB();
});
afterAll(async () => {
  await stopTestDB(mongod);
});
beforeEach(async () => {
  await clearTestDB();
  const child = await Child.create({
    userId: "test-user-id",
    name: "Emma",
    dateOfBirth: new Date("2019-01-01"),
  });
  childId = child._id.toString();
  const med = await MedicationDefinition.create({
    childId,
    name: "Paracetamol",
    dosage: 5,
    dosageUnit: "ml",
    frequency: 6,
    maxDosesPerDay: 4,
    startDate: new Date("2025-01-01T00:00:00Z"),
    endDate: new Date("2025-01-02T00:00:00Z"),
    isActive: true,
  });
  medDefId = med._id.toString();
});

function reminderDoc(overrides = {}) {
  return {
    medicationDefinitionId: medDefId,
    childId,
    scheduledTime: new Date("2025-01-01T08:00:00Z"),
    isCompleted: false,
    ...overrides,
  };
}

// ─── GET /api/reminders ───────────────────────────────────────────────────────

describe("GET /api/reminders", () => {
  it("returns an empty array when no reminders exist", async () => {
    const body = await (
      await GET(get(`/api/reminders?childId=${childId}`))
    ).json();
    expect(body).toEqual([]);
  });

  it("returns reminders sorted by scheduledTime ascending", async () => {
    await MedicationReminder.create(
      reminderDoc({ scheduledTime: new Date("2025-01-01T14:00:00Z") })
    );
    await MedicationReminder.create(
      reminderDoc({ scheduledTime: new Date("2025-01-01T08:00:00Z") })
    );

    const body = await (
      await GET(get(`/api/reminders?childId=${childId}`))
    ).json();
    expect(body).toHaveLength(2);
    expect(
      new Date(body[0].scheduledTime) < new Date(body[1].scheduledTime)
    ).toBe(true);
  });

  it("filters by isCompleted when the param is provided", async () => {
    await MedicationReminder.create(reminderDoc({ isCompleted: true }));
    await MedicationReminder.create(
      reminderDoc({ scheduledTime: new Date("2025-01-01T14:00:00Z") })
    );

    const body = await (
      await GET(get(`/api/reminders?childId=${childId}&isCompleted=false`))
    ).json();
    expect(body).toHaveLength(1);
    expect(body[0].isCompleted).toBe(false);
  });

  it("returns 404 when the child belongs to another user", async () => {
    const other = await Child.create({
      userId: "someone-else",
      name: "NotMine",
      dateOfBirth: new Date("2020-01-01"),
    });
    const res = await GET(get(`/api/reminders?childId=${other._id}`));
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/reminders ──────────────────────────────────────────────────────

describe("POST /api/reminders", () => {
  it("generates reminders across the medication schedule", async () => {
    const res = await POST(
      post("/api/reminders", { medicationDefinitionId: medDefId })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    // 24h window at 6h frequency, inclusive of both endpoints: 5 slots.
    expect(body.count).toBe(5);

    const stored = await MedicationReminder.countDocuments({ childId });
    expect(stored).toBe(5);
  });

  it("returns 400 for an invalid body", async () => {
    const res = await POST(
      post("/api/reminders", { medicationDefinitionId: "not-an-id" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the medication does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await POST(
      post("/api/reminders", { medicationDefinitionId: fakeId.toString() })
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when the medication belongs to another user's child", async () => {
    const other = await Child.create({
      userId: "someone-else",
      name: "NotMine",
      dateOfBirth: new Date("2020-01-01"),
    });
    const med = await MedicationDefinition.create({
      childId: other._id.toString(),
      name: "Foreign med",
      dosage: 5,
      dosageUnit: "ml",
      frequency: 6,
      maxDosesPerDay: 4,
      startDate: new Date("2025-01-01T00:00:00Z"),
      isActive: true,
    });

    const res = await POST(
      post("/api/reminders", { medicationDefinitionId: med._id.toString() })
    );
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/reminders/[id] ────────────────────────────────────────────────

function patchById(id: string, body: unknown) {
  return PATCH_BY_ID(patch(`/api/reminders/${id}`, body), {
    params: Promise.resolve({ id }),
  });
}

describe("PATCH /api/reminders/[id]", () => {
  it("marks a reminder as completed and sets completedAt", async () => {
    const reminder = await MedicationReminder.create(reminderDoc());

    const res = await patchById(reminder._id.toString(), {
      isCompleted: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isCompleted).toBe(true);
    expect(body.completedAt).toBeTruthy();
  });

  it("clears completedAt when marked incomplete again", async () => {
    const reminder = await MedicationReminder.create(
      reminderDoc({ isCompleted: true, completedAt: new Date() })
    );

    const res = await patchById(reminder._id.toString(), {
      isCompleted: false,
    });
    const body = await res.json();
    expect(body.isCompleted).toBe(false);
    expect(body.completedAt).toBeNull();
  });

  it("returns 404 when the reminder does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await patchById(fakeId, { isCompleted: true });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the reminder belongs to another user's child", async () => {
    const other = await Child.create({
      userId: "someone-else",
      name: "NotMine",
      dateOfBirth: new Date("2020-01-01"),
    });
    const reminder = await MedicationReminder.create(
      reminderDoc({ childId: other._id.toString() })
    );

    const res = await patchById(reminder._id.toString(), {
      isCompleted: true,
    });
    expect(res.status).toBe(404);
  });
});
