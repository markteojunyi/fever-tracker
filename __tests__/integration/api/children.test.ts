import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// connectDB is a no-op — mongoose is connected directly via MongoMemoryServer
vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

import { GET, POST, PATCH, DELETE } from "@/app/api/children/route";
import Child from "@/lib/models/Child";
import { startTestDB, stopTestDB, clearTestDB } from "@/tests/helpers/db";
import { get, post, patch, del } from "@/tests/helpers/request";

let mongod: MongoMemoryServer;
beforeAll(async () => { mongod = await startTestDB(); });
afterAll(async () => { await stopTestDB(mongod); });
beforeEach(async () => { await clearTestDB(); });

// ─── GET /api/children ────────────────────────────────────────────────────────

describe("GET /api/children", () => {
  it("returns an empty array when there are no records", async () => {
    const res = await GET(get("/api/children"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns all children sorted by createdAt descending", async () => {
    await Child.create({ name: "First", dateOfBirth: new Date("2020-01-01") });
    await new Promise((r) => setTimeout(r, 5)); // ensure distinct createdAt
    await Child.create({ name: "Second", dateOfBirth: new Date("2021-06-15") });

    const body = await (await GET(get("/api/children"))).json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("Second");
    expect(body[1].name).toBe("First");
  });

  it("includes _id, name, dateOfBirth in each record", async () => {
    await Child.create({ name: "Emma", dateOfBirth: new Date("2019-03-10") });
    const [child] = await (await GET(get("/api/children"))).json();
    expect(child._id).toBeTruthy();
    expect(child.name).toBe("Emma");
    expect(child.dateOfBirth).toBeTruthy();
  });
});

// ─── POST /api/children ───────────────────────────────────────────────────────

describe("POST /api/children", () => {
  it("creates a child and returns 201", async () => {
    const res = await POST(post("/api/children", { name: "Emma", dateOfBirth: "2019-03-10" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Emma");
    expect(body._id).toBeTruthy();
  });

  it("persists the record to the database", async () => {
    await POST(post("/api/children", { name: "Liam", dateOfBirth: "2020-07-04" }));
    const found = await Child.findOne({ name: "Liam" });
    expect(found).not.toBeNull();
  });

  it("stores optional weight when provided", async () => {
    const res = await POST(post("/api/children", { name: "Noah", dateOfBirth: "2021-01-01", weight: 12.5 }));
    const body = await res.json();
    expect(body.weight).toBe(12.5);
  });

  it("returns 500 when required fields are missing", async () => {
    const res = await POST(post("/api/children", { name: "NoDate" }));
    expect(res.status).toBe(500);
  });
});

// ─── PATCH /api/children ──────────────────────────────────────────────────────

describe("PATCH /api/children", () => {
  it("renames a child and returns the updated record", async () => {
    const child = await Child.create({ name: "Old Name", dateOfBirth: new Date("2020-01-01") });
    const res = await PATCH(patch(`/api/children?id=${child._id}`, { name: "New Name" }));
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe("New Name");
  });

  it("persists the new name in the database", async () => {
    const child = await Child.create({ name: "Before", dateOfBirth: new Date("2020-01-01") });
    await PATCH(patch(`/api/children?id=${child._id}`, { name: "After" }));
    const updated = await Child.findById(child._id);
    expect(updated?.name).toBe("After");
  });

  it("returns 400 when id query param is missing", async () => {
    const res = await PATCH(patch("/api/children", { name: "X" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is missing from body", async () => {
    const child = await Child.create({ name: "Test", dateOfBirth: new Date("2020-01-01") });
    const res = await PATCH(patch(`/api/children?id=${child._id}`, {}));
    expect(res.status).toBe(400);
  });

  it("returns 404 for a non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await PATCH(patch(`/api/children?id=${fakeId}`, { name: "Ghost" }));
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/children ─────────────────────────────────────────────────────

describe("DELETE /api/children", () => {
  it("deletes a child and returns 200", async () => {
    const child = await Child.create({ name: "Delete Me", dateOfBirth: new Date("2020-01-01") });
    const res = await DELETE(del(`/api/children?id=${child._id}`));
    expect(res.status).toBe(200);
  });

  it("removes the record from the database", async () => {
    const child = await Child.create({ name: "Gone", dateOfBirth: new Date("2020-01-01") });
    await DELETE(del(`/api/children?id=${child._id}`));
    expect(await Child.findById(child._id)).toBeNull();
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(del("/api/children"));
    expect(res.status).toBe(400);
  });
});
