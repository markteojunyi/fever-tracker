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
import bcrypt from "bcryptjs";

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mocked to short-circuit next-auth's import chain under Vitest. Register and
// reset-password routes themselves don't use auth — they're public — but they
// transitively load lib/api/withHandler, which imports @/auth.
vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

import { POST as register } from "@/app/api/register/route";
import { POST as resetPassword } from "@/app/api/reset-password/route";
import User from "@/models/User";
import { startTestDB, stopTestDB, clearTestDB } from "@/tests/helpers/db";
import { post } from "@/tests/helpers/request";

let mongod: MongoMemoryServer;
beforeAll(async () => {
  mongod = await startTestDB();
});
afterAll(async () => {
  await stopTestDB(mongod);
});
beforeEach(async () => {
  await clearTestDB();
});

// ─── POST /api/register ───────────────────────────────────────────────────────

describe("POST /api/register", () => {
  it("creates a user and returns 201", async () => {
    const res = await register(
      post("/api/register", {
        name: "Alice",
        email: "alice@example.com",
        password: "secret123",
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("alice@example.com");
    expect(body.user.name).toBe("Alice");
    expect(body.user.id).toBeTruthy();
  });

  it("stores the email in lowercase regardless of input", async () => {
    await register(
      post("/api/register", {
        name: "Bob",
        email: "BOB@EXAMPLE.COM",
        password: "password1",
      })
    );
    const found = await User.findOne({ email: "bob@example.com" });
    expect(found).not.toBeNull();
  });

  it("stores a hashed password, not the plaintext", async () => {
    await register(
      post("/api/register", {
        name: "Carol",
        email: "carol@example.com",
        password: "mypassword",
      })
    );
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
    const res = await register(
      post("/api/register", {
        name: "Eve",
        email: "eve@example.com",
        password: "abc",
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/6 characters/);
  });

  it("returns 400 when email is already registered", async () => {
    await register(
      post("/api/register", {
        name: "Frank",
        email: "frank@example.com",
        password: "password1",
      })
    );
    const res = await register(
      post("/api/register", {
        name: "Frank2",
        email: "frank@example.com",
        password: "password2",
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/already exists/i);
  });

  it("does not expose the password in the response", async () => {
    const res = await register(
      post("/api/register", {
        name: "Grace",
        email: "grace@example.com",
        password: "password1",
      })
    );
    const body = await res.json();
    expect(body.user.password).toBeUndefined();
  });
});

// ─── POST /api/reset-password ─────────────────────────────────────────────────

describe("POST /api/reset-password", () => {
  it("returns 503 (endpoint disabled pending token-based rebuild)", async () => {
    const res = await resetPassword(
      post("/api/reset-password", {
        email: "anyone@example.com",
        newPassword: "ignored",
      })
    );
    expect(res.status).toBe(503);
  });
});
