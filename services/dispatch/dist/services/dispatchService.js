"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDriver = assignDriver;
exports.getDispatch = getDispatch;
exports.updateDispatchStatus = updateDispatchStatus;
const client_1 = require("../db/client");
const kafkaProducer_1 = require("./kafkaProducer");
const dispatch_1 = require("../models/dispatch");
async function assignDriver(orderId, driverId) {
    const client = await client_1.pool.connect();
    try {
        await client.query("BEGIN");
        // Create dispatch record
        const result = await client.query(`INSERT INTO dispatches (order_id, driver_id, status, assigned_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`, [orderId, driverId, dispatch_1.DispatchStatus.ASSIGNED]);
        const dispatch = result.rows[0];
        // Publish event to Kafka
        await (0, kafkaProducer_1.publishEvent)("dispatch.assigned", {
            dispatchId: dispatch.id,
            orderId,
            driverId,
            timestamp: new Date().toISOString(),
        });
        await client.query("COMMIT");
        return dispatch;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function getDispatch(id) {
    const result = await client_1.pool.query("SELECT * FROM dispatches WHERE id = $1", [id]);
    return result.rows[0] || null;
}
async function updateDispatchStatus(id, status) {
    const result = await client_1.pool.query(`UPDATE dispatches SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`, [status, id]);
    const dispatch = result.rows[0];
    await (0, kafkaProducer_1.publishEvent)("dispatch.status.changed", {
        dispatchId: id,
        status,
        timestamp: new Date().toISOString(),
    });
    return dispatch;
}
