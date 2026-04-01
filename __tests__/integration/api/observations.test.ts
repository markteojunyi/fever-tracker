import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

import { GET, POST, DELETE } from "@/app/api/observations/route";
import Child from "@/lib/models/Child";
import Observation from "@/lib/models/Observation";
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

// ─── GET /api/observations ────────────────────────────────────────────────────

describe("GET /api/observations", () => {
  it("returns 400 when childId is not provided", async () => {
    const res = await GET(get("/api/observations"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/childId/);
  });

  it("returns 404 when the child does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await GET(get(`/api/observations?childId=${fakeId}`));
    expect(res.status).toBe(404);
  });

  it("returns an empty array when the child has no observations", async () => {
    const body = await (await GET(get(`/api/observations?childId=${childId}`))).json();
    expect(body).toEqual([]);
  });

  it("returns observations sorted by observedAt descending (most recent first)", async () => {
    await Observation.create({ childId, content: "Ate breakfast", observedAt: new Date("2025-01-16T08:00:00Z") });
    await Observation.create({ childId, content: "Looks tired", observedAt: new Date("2025-01-16T14:00:00Z") });
    await Observation.create({ childId, content: "Cough worsening", observedAt: new Date("2025-01-16T20:00:00Z") });

    const body = await (await GET(get(`/api/observations?childId=${childId}`))).json();
    expect(body).toHaveLength(3);
    expect(body[0].content).toBe("Cough worsening");
    expect(body[2].content).toBe("Ate breakfast");
  });

  it("does not return observations belonging to a different child", async () => {
    const other = await Child.create({ name: "Other", dateOfBirth: new Date("2020-01-01") });
    await Observation.create({ childId: other._id, content: "Other child obs" });

    const body = await (await GET(get(`/api/observations?childId=${childId}`))).json();
    expect(body).toHaveLength(0);
  });
});

// ─── POST /api/observations ───────────────────────────────────────────────────

describe("POST /api/observations", () => {
  it("creates an observation and returns 201", async () => {
    const res = await POST(post("/api/observations", { childId, content: "Looks drowsy" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body._id).toBeTruthy();
    expect(body.content).toBe("Looks drowsy");
  });

  it("persists the observation to the database", async () => {
    await POST(post("/api/observations", { childId, content: "Refused to eat" }));
    const found = await Observation.findOne({ content: "Refused to eat" });
    expect(found).not.toBeNull();
  });

  it("trims whitespace from content", async () => {
    const res = await POST(post("/api/observations", { childId, content: "  Had a nap  " }));
    expect((await res.json()).content).toBe("Had a nap");
  });

  it("accepts a custom observedAt timestamp", async () => {
    const timestamp = "2025-01-15T09:30:00.000Z";
    const res = await POST(post("/api/observations", { childId, content: "Note", observedAt: timestamp }));
    const body = await res.json();
    expect(new Date(body.observedAt).toISOString()).toBe(timestamp);
  });

  it("returns 400 when content is missing", async () => {
    const res = await POST(post("/api/observations", { childId }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is only whitespace", async () => {
    const res = await POST(post("/api/observations", { childId, content: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the child does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await POST(post("/api/observations", { childId: fakeId, content: "Ghost" }));
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/observations ─────────────────────────────────────────────────

describe("DELETE /api/observations", () => {
  it("deletes an observation and returns 200", async () => {
    const obs = await Observation.create({ childId, content: "Delete me" });
    const res = await DELETE(del(`/api/observations?id=${obs._id}`));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("removes the observation from the database", async () => {
    const obs = await Observation.create({ childId, content: "Gone" });
    await DELETE(del(`/api/observations?id=${obs._id}`));
    expect(await Observation.findById(obs._id)).toBeNull();
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(del("/api/observations"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the observation does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await DELETE(del(`/api/observations?id=${fakeId}`));
    expect(res.status).toBe(404);
  });
});
