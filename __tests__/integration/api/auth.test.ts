import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

import { POST as register } from "@/app/api/register/route";
import { POST as resetPassword } from "@/app/api/reset-password/route";
import User from "@/models/User";
import { startTestDB, stopTestDB, clearTestDB } from "@/tests/helpers/db";
import { post } from "@/tests/helpers/request";

let mongod: MongoMemoryServer;
beforeAll(async () => { mongod = await startTestDB(); });
afterAll(async () => { await stopTestDB(mongod); });
beforeEach(async () => { await clearTestDB(); });

// ─── POST /api/register ───────────────────────────────────────────────────────

describe("POST /api/register", () => {
  it("creates a user and returns 201", async () => {
    const res = await register(post("/api/register", {
      name: "Alice", email: "alice@example.com", password: "secret123",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("alice@example.com");
    expect(body.user.name).toBe("Alice");
    expect(body.user.id).toBeTruthy();
  });

  it("stores the email in lowercase regardless of input", async () => {
    await register(post("/api/register", {
      name: "Bob", email: "BOB@EXAMPLE.COM", password: "password1",
    }));
    const found = await User.findOne({ email: "bob@example.com" });
    expect(found).not.toBeNull();
  });

  it("stores a hashed password, not the plaintext", async () => {
    await register(post("/api/register", {
      name: "Carol", email: "carol@example.com", password: "mypassword",
    }));
    const user = await User.findOne({ email: "carol@example.com" });
    expect(user?.password).not.toBe("mypassword");
    expect(await bcrypt.compare("mypassword", user!.password)).toBe(true);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await register(post("/api/register", { name: "Dave" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Missing/i);
  });

  it("returns 400 when password is shorter than 6 characters", async () => {
    const res = await register(post("/api/register", {
      name: "Eve", email: "eve@example.com", password: "abc",
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/6 characters/);
  });

  it("returns 400 when email is already registered", async () => {
    await register(post("/api/register", {
      name: "Frank", email: "frank@example.com", password: "password1",
    }));
    const res = await register(post("/api/register", {
      name: "Frank2", email: "frank@example.com", password: "password2",
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/already exists/i);
  });

  it("does not expose the password in the response", async () => {
    const res = await register(post("/api/register", {
      name: "Grace", email: "grace@example.com", password: "password1",
    }));
    const body = await res.json();
    expect(body.user.password).toBeUndefined();
  });
});

// ─── POST /api/reset-password ─────────────────────────────────────────────────

describe("POST /api/reset-password", () => {
  beforeEach(async () => {
    // Seed a user to reset
    const hashed = await bcrypt.hash("oldpassword", 10);
    await User.create({ name: "Henry", email: "henry@example.com", password: hashed });
  });

  it("updates the password and returns 200", async () => {
    const res = await resetPassword(post("/api/reset-password", {
      email: "henry@example.com", newPassword: "newpassword",
    }));
    expect(res.status).toBe(200);
    expect((await res.json()).message).toMatch(/updated/i);
  });

  it("stores the new password as a bcrypt hash", async () => {
    await resetPassword(post("/api/reset-password", {
      email: "henry@example.com", newPassword: "supersecure",
    }));
    const user = await User.findOne({ email: "henry@example.com" });
    expect(await bcrypt.compare("supersecure", user!.password)).toBe(true);
  });

  it("the old password no longer works after reset", async () => {
    await resetPassword(post("/api/reset-password", {
      email: "henry@example.com", newPassword: "brandnew",
    }));
    const user = await User.findOne({ email: "henry@example.com" });
    expect(await bcrypt.compare("oldpassword", user!.password)).toBe(false);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await resetPassword(post("/api/reset-password", { email: "henry@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when new password is shorter than 6 characters", async () => {
    const res = await resetPassword(post("/api/reset-password", {
      email: "henry@example.com", newPassword: "abc",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the email is not registered", async () => {
    const res = await resetPassword(post("/api/reset-password", {
      email: "nobody@example.com", newPassword: "password1",
    }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/No account/i);
  });

  it("is case-insensitive for email lookup", async () => {
    const res = await resetPassword(post("/api/reset-password", {
      email: "HENRY@EXAMPLE.COM", newPassword: "newpassword",
    }));
    expect(res.status).toBe(200);
  });
});
