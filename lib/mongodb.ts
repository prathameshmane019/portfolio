import { MongoClient, type Db } from "mongodb";

type MongoGlobal = typeof globalThis & {
  portfolioMongoClient?: Promise<MongoClient>;
};

const mongoGlobal = globalThis as MongoGlobal;

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export function isPersistentStoreRequiredButMissing() {
  return Boolean(process.env.VERCEL) && !isMongoConfigured();
}

export const MONGODB_SETUP_MESSAGE =
  "Persistent storage is not configured for this Vercel deployment. Add MONGODB_URI in Vercel project settings and redeploy.";

export async function getMongoDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MongoDB is not configured. Set MONGODB_URI to enable persistent storage.");
  }

  if (!mongoGlobal.portfolioMongoClient) {
    const clientPromise = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10_000,
    }).connect();
    mongoGlobal.portfolioMongoClient = clientPromise;
    clientPromise.catch(() => {
      if (mongoGlobal.portfolioMongoClient === clientPromise) {
        mongoGlobal.portfolioMongoClient = undefined;
      }
    });
  }

  const client = await mongoGlobal.portfolioMongoClient;
  return client.db(process.env.MONGODB_DB?.trim() || "portfolio");
}
