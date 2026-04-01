import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

/**
 * Starts an in-memory MongoDB instance and connects mongoose to it.
 * Call in beforeAll. Returns the server so it can be stopped in afterAll.
 */
export async function startTestDB(): Promise<MongoMemoryServer> {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  return mongod;
}

/**
 * Drops all data, disconnects mongoose, and stops the in-memory server.
 * Call in afterAll.
 */
export async function stopTestDB(mongod: MongoMemoryServer): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
}

/**
 * Removes all documents from every collection.
 * Call in beforeEach to keep tests isolated.
 */
export async function clearTestDB(): Promise<void> {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}
