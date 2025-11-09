"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getOrder = getOrder;
exports.listOrders = listOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.cancelOrder = cancelOrder;
const client_1 = require("../db/client");
const kafkaProducer_1 = require("./kafkaProducer");
const order_1 = require("../models/order");
async function createOrder(request) {
    const client = await client_1.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`INSERT INTO orders (customer_id, order_type, status, pickup_location, dropoff_location, pickup_time, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [
            request.customer_id,
            request.order_type,
            order_1.OrderStatus.PENDING,
            request.pickup_location,
            request.dropoff_location,
            request.pickup_time || null,
            request.special_instructions || null,
        ]);
        const order = result.rows[0];
        await (0, kafkaProducer_1.publishEvent)("order.created", {
            orderId: order.id,
            customerId: order.customer_id,
            orderType: order.order_type,
            pickupLocation: order.pickup_location,
            dropoffLocation: order.dropoff_location,
            timestamp: new Date().toISOString(),
        });
        await client.query("COMMIT");
        return order;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function getOrder(id) {
    const result = await client_1.pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    return result.rows[0] || null;
}
async function listOrders(customerId) {
    let query = "SELECT * FROM orders";
    const params = [];
    if (customerId) {
        query += " WHERE customer_id = $1";
        params.push(customerId);
    }
    query += " ORDER BY created_at DESC";
    const result = await client_1.pool.query(query, params);
    return result.rows;
}
async function updateOrderStatus(id, status) {
    const result = await client_1.pool.query(`UPDATE orders SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`, [status, id]);
    const order = result.rows[0];
    await (0, kafkaProducer_1.publishEvent)("order.status.changed", {
        orderId: id,
        status,
        timestamp: new Date().toISOString(),
    });
    return order;
}
async function cancelOrder(id) {
    return updateOrderStatus(id, order_1.OrderStatus.CANCELLED);
}
