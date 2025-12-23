import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool as NodePool } from "pg";
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// For local development, disable WebSocket and use standard PostgreSQL
const isLocalDevelopment = process.env.NODE_ENV === "development";

console.log("Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL
    ? process.env.DATABASE_URL.substring(0, 30) + "..."
    : "undefined",
  isLocalDevelopment,
});

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleNode>;

if (isLocalDevelopment) {
  // Use standard PostgreSQL connection for local development
  console.log("Using standard PostgreSQL connection for local development");
  const nodePool = new NodePool({
    connectionString: process.env.DATABASE_URL,
    ssl: false, // Disable SSL for local development
  });
  db = drizzleNode({ client: nodePool, schema });
} else {
  // Use Neon serverless connection for production
  console.log("Using Neon serverless connection");
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db };
