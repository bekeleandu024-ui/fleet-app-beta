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
/**
 * Generate a meaningful 9-character order ID
 * Format: [TYPE][ORIGIN][DEST][SEQ]
 * - TYPE: P (Pickup), D (Delivery), R (Round Trip)
 * - ORIGIN: 2 chars from pickup location
 * - DEST: 2 chars from dropoff location
 * - SEQ: 4 digit sequence number
 * Example: PLANY3421 (Pickup from LA to NY, sequence 3421)
 */
function generateOrderId(orderType, pickup, dropoff, sequence) {
    // Type prefix
    const typeCode = orderType === order_1.OrderType.PICKUP ? 'P' :
        orderType === order_1.OrderType.DELIVERY ? 'D' : 'R';
    // Extract location codes (first 2 letters, uppercase)
    const pickupCode = pickup.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'XX';
    const dropoffCode = dropoff.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'XX';
    // 4-digit sequence with padding
    const seqCode = sequence.toString().padStart(4, '0');
    return `${typeCode}${pickupCode}${dropoffCode}${seqCode}`;
}
async function createOrder(request) {
    const client = await client_1.pool.connect();
    try {
        await client.query("BEGIN");
        // Get next sequence number for today
        const seqResult = await client.query(`SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 6) AS INTEGER)), 0) + 1 AS next_seq
       FROM orders
       WHERE DATE(created_at) = CURRENT_DATE
       AND id ~ '^[PDR][A-Z]{4}[0-9]{4}$'`);
        const sequence = seqResult.rows[0]?.next_seq || 1;
        // Generate meaningful order ID
        const orderId = generateOrderId(request.order_type, request.pickup_location, request.dropoff_location, sequence);
        const result = await client.query(`INSERT INTO orders (id, customer_id, order_type, status, pickup_location, dropoff_location, pickup_time, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [
            orderId,
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
async function updateOrderStatus(id, status, notes) {
    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const params = [status];
    if (notes) {
        updateFields.push(`special_instructions = COALESCE(special_instructions, '') || '\n[Qualification] ' || $${params.length + 1}`);
        params.push(notes);
    }
    params.push(id);
    const result = await client_1.pool.query(`UPDATE orders SET ${updateFields.join(', ')}
     WHERE id = $${params.length}
     RETURNING *`, params);
    const order = result.rows[0];
    await (0, kafkaProducer_1.publishEvent)("order.status.changed", {
        orderId: id,
        status,
        notes,
        timestamp: new Date().toISOString(),
    });
    return order;
}
async function cancelOrder(id) {
    return updateOrderStatus(id, order_1.OrderStatus.CANCELLED);
}
