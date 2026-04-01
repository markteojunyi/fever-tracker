import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

import { GET, POST, DELETE } from "@/app/api/temperatures/route";
import Child from "@/lib/models/Child";
import TemperatureReading from "@/lib/models/TemperatureReading";
import { startTestDB, stopTestDB, clearTestDB } from "@/tests/helpers/db";
import { get, post, del } from "@/tests/helpers/request";

let mongod: MongoMemoryServer;
let childId: string;

beforeAll(async () => { mongod = await startTestDB(); });
afterAll(async () => { await stopTestDB(mongod); });
beforeEach(async () => {
  await clearTestDB();
  const child = await Child.create({ name: "Emma", dateOfBirth: new Date("2019-01-01") });
  childId = child._id.toString();
});

// ─── GET /api/temperatures ────────────────────────────────────────────────────

describe("GET /api/temperatures", () => {
  it("returns 400 when childId is not provided", async () => {
    const res = await GET(get("/api/temperatures"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/childId/);
  });

  it("returns an empty array for a child with no readings", async () => {
    const body = await (await GET(get(`/api/temperatures?childId=${childId}`))).json();
    expect(body).toEqual([]);
  });

  it("returns readings for the specified child", async () => {
    await TemperatureReading.create({
      childId, temperature: 38.2, temperatureUnit: "C",
      timestamp: new Date(),
    });
    const body = await (await GET(get(`/api/temperatures?childId=${childId}`))).json();
    expect(body).toHaveLength(1);
    expect(body[0].temperature).toBe(38.2);
  });

  it("returns readings sorted by timestamp ascending", async () => {
    const t1 = new Date("2025-01-16T08:00:00Z");
    const t2 = new Date("2025-01-16T10:00:00Z");
    const t3 = new Date("2025-01-16T14:00:00Z");

    // Insert in reverse order
    await TemperatureReading.create({ childId, temperature: 39.1, temperatureUnit: "C", timestamp: t3 });
    await TemperatureReading.create({ childId, temperature: 37.5, temperatureUnit: "C", timestamp: t1 });
    await TemperatureReading.create({ childId, temperature: 38.8, temperatureUnit: "C", timestamp: t2 });

    const body = await (await GET(get(`/api/temperatures?childId=${childId}`))).json();
    expect(body[0].temperature).toBe(37.5);
    expect(body[1].temperature).toBe(38.8);
    expect(body[2].temperature).toBe(39.1);
  });

  it("does not return readings belonging to a different child", async () => {
    const other = await Child.create({ name: "Other", dateOfBirth: new Date("2020-01-01") });
    await TemperatureReading.create({
      childId: other._id, temperature: 37.0, temperatureUnit: "C", timestamp: new Date(),
    });

    const body = await (await GET(get(`/api/temperatures?childId=${childId}`))).json();
    expect(body).toHaveLength(0);
  });
});

// ─── POST /api/temperatures ───────────────────────────────────────────────────

describe("POST /api/temperatures", () => {
  it("creates a reading and returns 201", async () => {
    const res = await POST(post("/api/temperatures", {
      childId, temperature: 38.5, temperatureUnit: "C",
      timestamp: new Date().toISOString(),
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body._id).toBeTruthy();
    expect(body.temperature).toBe(38.5);
  });

  it("persists the reading to the database", async () => {
    await POST(post("/api/temperatures", {
      childId, temperature: 37.8, temperatureUnit: "C",
      timestamp: new Date().toISOString(),
    }));
    const found = await TemperatureReading.findOne({ childId, temperature: 37.8 });
    expect(found).not.toBeNull();
  });

  it("saves optional notes when provided", async () => {
    const res = await POST(post("/api/temperatures", {
      childId, temperature: 38.0, temperatureUnit: "C",
      timestamp: new Date().toISOString(), notes: "After paracetamol",
    }));
    expect((await res.json()).notes).toBe("After paracetamol");
  });

  it("returns 500 when temperature is out of the valid range", async () => {
    const res = await POST(post("/api/temperatures", {
      childId, temperature: 44, temperatureUnit: "C",
      timestamp: new Date().toISOString(),
    }));
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/temperatures ─────────────────────────────────────────────────

describe("DELETE /api/temperatures", () => {
  it("deletes a reading and returns 200", async () => {
    const reading = await TemperatureReading.create({
      childId, temperature: 38.0, temperatureUnit: "C", timestamp: new Date(),
    });
    const res = await DELETE(del(`/api/temperatures?id=${reading._id}`));
    expect(res.status).toBe(200);
  });

  it("removes the reading from the database", async () => {
    const reading = await TemperatureReading.create({
      childId, temperature: 38.0, temperatureUnit: "C", timestamp: new Date(),
    });
    await DELETE(del(`/api/temperatures?id=${reading._id}`));
    expect(await TemperatureReading.findById(reading._id)).toBeNull();
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(del("/api/temperatures"));
    expect(res.status).toBe(400);
  });

  it("returns 200 even for a non-existent id (findByIdAndDelete is idempotent)", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await DELETE(del(`/api/temperatures?id=${fakeId}`));
    expect(res.status).toBe(200);
  });
});
