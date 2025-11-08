import { pool } from "../db/client";
import { publishEvent } from "./kafkaProducer";
import { Dispatch, DispatchStatus } from "../models/dispatch";

export async function assignDriver(orderId: string, driverId: string): Promise<Dispatch> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create dispatch record
    const result = await client.query(
      `INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [orderId, driverId, DispatchStatus.ASSIGNED]
    );

    const dispatch = result.rows[0];

    // Publish event to Kafka
    await publishEvent("dispatch.assigned", {
      dispatchId: dispatch.id,
      orderId,
      driverId,
      timestamp: new Date().toISOString(),
    });

    await client.query("COMMIT");
    return dispatch;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getDispatch(id: string): Promise<Dispatch | null> {
  const result = await pool.query("SELECT * FROM dispatches WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function updateDispatchStatus(id: string, status: DispatchStatus): Promise<Dispatch> {
  const result = await pool.query(
    `UPDATE dispatches SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  const dispatch = result.rows[0];

  await publishEvent("dispatch.status.changed", {
    dispatchId: id,
    status,
    timestamp: new Date().toISOString(),
  });

  return dispatch;
}
