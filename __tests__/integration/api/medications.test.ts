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

import { GET, POST, PATCH } from "@/app/api/medications/route";
import Child from "@/lib/models/Child";
import MedicationDefinition from "@/lib/models/MedicationDefinition";
import { startTestDB, stopTestDB, clearTestDB } from "@/tests/helpers/db";
import { get, post, patch } from "@/tests/helpers/request";

let mongod: MongoMemoryServer;
let childId: string;

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
});

function medPayload(overrides = {}) {
  return {
    childId,
    name: "Ibuprofen",
    dosage: 5,
    dosageUnit: "ml",
    frequency: 6,
    maxDosesPerDay: 4,
    startDate: "2025-01-01",
    ...overrides,
  };
}

async function createOtherUsersChild() {
  const other = await Child.create({
    userId: "someone-else",
    name: "NotMine",
    dateOfBirth: new Date("2020-01-01"),
  });
  return other._id.toString();
}

// ─── GET /api/medications ─────────────────────────────────────────────────────

describe("GET /api/medications", () => {
  it("returns an empty array when no medications exist", async () => {
    const body = await (
      await GET(get(`/api/medications?childId=${childId}`))
    ).json();
    expect(body).toEqual([]);
  });

  it("returns medications for the specified child", async () => {
    await MedicationDefinition.create({ ...medPayload(), isActive: true });
    await MedicationDefinition.create({
      ...medPayload({ name: "Paracetamol" }),
      isActive: true,
    });

    const body = await (
      await GET(get(`/api/medications?childId=${childId}`))
    ).json();
    expect(body).toHaveLength(2);
  });

  it("filters by isActive when the param is provided", async () => {
    await MedicationDefinition.create({ ...medPayload(), isActive: true });
    await MedicationDefinition.create({
      ...medPayload({ name: "Old med" }),
      isActive: false,
    });

    const body = await (
      await GET(get(`/api/medications?childId=${childId}&isActive=true`))
    ).json();
    expect(body).toHaveLength(1);
    expect(body[0].isActive).toBe(true);
  });

  it("returns 404 when the child belongs to another user", async () => {
    const otherChildId = await createOtherUsersChild();
    const res = await GET(get(`/api/medications?childId=${otherChildId}`));
    expect(res.status).toBe(404);
  });

  it("only returns medications of owned children when childId is omitted", async () => {
    const otherChildId = await createOtherUsersChild();
    await MedicationDefinition.create({ ...medPayload(), isActive: true });
    await MedicationDefinition.create({
      ...medPayload({ childId: otherChildId, name: "Foreign med" }),
      isActive: true,
    });

    const body = await (await GET(get("/api/medications"))).json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Ibuprofen");
  });
});

// ─── POST /api/medications ────────────────────────────────────────────────────

describe("POST /api/medications", () => {
  it("creates a medication and returns 201", async () => {
    const res = await POST(post("/api/medications", medPayload()));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Ibuprofen");
    expect(body.isActive).toBe(true);
  });

  it("persists the medication to the database", async () => {
    await POST(post("/api/medications", medPayload()));
    const count = await MedicationDefinition.countDocuments({ childId });
    expect(count).toBe(1);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(post("/api/medications", { childId }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid dosageUnit", async () => {
    const res = await POST(
      post("/api/medications", medPayload({ dosageUnit: "gallons" }))
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the child belongs to another user", async () => {
    const otherChildId = await createOtherUsersChild();
    const res = await POST(
      post("/api/medications", medPayload({ childId: otherChildId }))
    );
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/medications ───────────────────────────────────────────────────

describe("PATCH /api/medications", () => {
  it("updates fields and returns the updated record", async () => {
    const med = await MedicationDefinition.create({
      ...medPayload(),
      isActive: true,
    });

    const res = await PATCH(
      patch(`/api/medications?id=${med._id}`, { dosage: 10, isActive: false })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dosage).toBe(10);
    expect(body.isActive).toBe(false);
  });

  it("returns 400 when id is missing", async () => {
    const res = await PATCH(patch("/api/medications", { dosage: 10 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid body", async () => {
    const med = await MedicationDefinition.create({
      ...medPayload(),
      isActive: true,
    });
    const res = await PATCH(
      patch(`/api/medications?id=${med._id}`, { dosage: -5 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the medication does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await PATCH(
      patch(`/api/medications?id=${fakeId}`, { dosage: 10 })
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when the medication belongs to another user's child", async () => {
    const otherChildId = await createOtherUsersChild();
    const med = await MedicationDefinition.create({
      ...medPayload({ childId: otherChildId }),
      isActive: true,
    });

    const res = await PATCH(
      patch(`/api/medications?id=${med._id}`, { dosage: 10 })
    );
    expect(res.status).toBe(404);
  });
});
