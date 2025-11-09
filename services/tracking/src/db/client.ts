import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { DATABASE_URL, SERVICE_NAME } from "../config/config";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  application_name: SERVICE_NAME,
});

export async function withTransaction<T>(
  work: (client: TransactionClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const txClient = createTransactionClient(client);
    const result = await work(txClient);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface TransactionClient {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: any[]
  ) => Promise<QueryResult<T>>;
}

function createTransactionClient(client: PoolClient): TransactionClient {
  return {
    query: (text, params) => client.query(text, params),
  };
}
