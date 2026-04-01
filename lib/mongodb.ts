// ─── Singleton Pattern ────────────────────────────────────────────────────────
// Before: ad-hoc singleton using raw `global.mongoose` object with manual
//         null-checks scattered through the connect function.
// After:  explicit Singleton class — private constructor prevents external
//         instantiation; static getInstance() is the sole access point.
//         We still store the instance on `global` so Next.js hot-reload in dev
//         doesn't create a second connection (module cache is wiped on reload,
//         but `global` survives).
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: DatabaseConnection | undefined;
}

class DatabaseConnection {
  private conn: typeof mongoose | null = null;
  private promise: Promise<typeof mongoose> | null = null;

  // Private constructor — no one outside this class can call `new DatabaseConnection()`
  private constructor(private readonly uri: string) {}

  static getInstance(): DatabaseConnection {
    if (!global.__dbInstance) {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error("Please define MONGODB_URI in .env.local");
      global.__dbInstance = new DatabaseConnection(uri);
    }
    return global.__dbInstance;
  }

  async connect(): Promise<typeof mongoose> {
    if (this.conn) return this.conn;

    if (!this.promise) {
      this.promise = mongoose.connect(this.uri, { bufferCommands: false });
    }

    try {
      this.conn = await this.promise;
    } catch (e) {
      this.promise = null; // allow retry on next call
      throw e;
    }

    return this.conn;
  }
}

// Export a simple function so call-sites don't change: `await connectDB()`
export default function connectDB() {
  return DatabaseConnection.getInstance().connect();
}
