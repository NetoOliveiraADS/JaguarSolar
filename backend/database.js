import { Pool } from "pg";

const URL = "postgresql://postgres:3012@localhost:5432/jaguarsolar";

export const database = new Pool({
  connectionString: URL,
});