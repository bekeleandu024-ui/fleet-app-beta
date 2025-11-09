"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raiseException = raiseException;
exports.resolveException = resolveException;
exports.getActiveExceptions = getActiveExceptions;
const client_1 = require("../db/client");
const parsers_1 = require("../lib/parsers");
const kafkaProducer_1 = require("./kafkaProducer");
async function raiseException(input) {
    const result = await client_1.pool.query(`INSERT INTO trip_exceptions (trip_id, exception_type, severity, message)
     VALUES ($1,$2,$3,$4)
     RETURNING *`, [input.tripId, input.type, input.severity, input.message]);
    const exception = (0, parsers_1.mapExceptionRow)(result.rows[0]);
    await (0, kafkaProducer_1.publishEvent)("tracking.exception.raised", {
        tripId: input.tripId,
        exceptionType: input.type,
        severity: input.severity,
        message: input.message,
        timestamp: exception.created_at.toISOString(),
    });
    return exception;
}
async function resolveException(exceptionId) {
    const result = await client_1.pool.query(`UPDATE trip_exceptions
        SET resolved = TRUE,
            resolved_at = NOW()
      WHERE id = $1
      RETURNING *`, [exceptionId]);
    if (!result.rows.length) {
        throw new Error(`Exception ${exceptionId} not found`);
    }
    const exception = (0, parsers_1.mapExceptionRow)(result.rows[0]);
    await (0, kafkaProducer_1.publishEvent)("tracking.exception.resolved", {
        tripId: exception.trip_id,
        exceptionId,
        timestamp: exception.resolved_at?.toISOString?.(),
    });
    return exception;
}
async function getActiveExceptions(tripId) {
    const result = await client_1.pool.query(`SELECT * FROM trip_exceptions
      WHERE trip_id = $1 AND resolved = FALSE
      ORDER BY created_at DESC`, [tripId]);
    return result.rows.map(parsers_1.mapExceptionRow);
}
