import { pool } from "../db/client";
import { publishEvent } from "./kafkaProducer";
import { Order, OrderStatus, CreateOrderRequest } from "../models/order";

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO orders (customer_id, order_type, status, pickup_location, dropoff_location, pickup_time, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        request.customer_id,
        request.order_type,
        OrderStatus.PENDING,
        request.pickup_location,
        request.dropoff_location,
        request.pickup_time || null,
        request.special_instructions || null,
      ]
    );

    const order = result.rows[0];

    await publishEvent("order.created", {
      orderId: order.id,
      customerId: order.customer_id,
      orderType: order.order_type,
      pickupLocation: order.pickup_location,
      dropoffLocation: order.dropoff_location,
      timestamp: new Date().toISOString(),
    });

    await client.query("COMMIT");
    return order;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function listOrders(customerId?: string): Promise<Order[]> {
  let query = "SELECT * FROM orders";
  const params: any[] = [];

  if (customerId) {
    query += " WHERE customer_id = $1";
    params.push(customerId);
  }

  query += " ORDER BY created_at DESC";
  const result = await pool.query(query, params);
  return result.rows;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const result = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  const order = result.rows[0];

  await publishEvent("order.status.changed", {
    orderId: id,
    status,
    timestamp: new Date().toISOString(),
  });

  return order;
}

export async function cancelOrder(id: string): Promise<Order> {
  return updateOrderStatus(id, OrderStatus.CANCELLED);
}
