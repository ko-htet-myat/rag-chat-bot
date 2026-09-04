import { drizzle } from "drizzle-orm/node-postgres";
import { withReplicas } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import "dotenv/config";

const primaryDb = drizzle(
  new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
);
const read = drizzle(
  new Pool({
    connectionString: process.env.READ_REPLICA_URL!,
  }),
);

export const db = withReplicas(primaryDb, [read]);
