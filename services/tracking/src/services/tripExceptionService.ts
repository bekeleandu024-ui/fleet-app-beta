import { pool } from "../db/client";
import { TripException, ExceptionType } from "../models/tracking";
import { mapExceptionRow } from "../lib/parsers";
import { publishEvent } from "./kafkaProducer";

export interface RaiseExceptionInput {
  tripId: string;
  type: ExceptionType;
  severity: TripException["severity"];
  message: string;
}

export async function raiseException(
  input: RaiseExceptionInput
): Promise<TripException> {
  const result = await pool.query(
    `INSERT INTO trip_exceptions (trip_id, exception_type, severity, message)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [input.tripId, input.type, input.severity, input.message]
  );

  const exception = mapExceptionRow(result.rows[0]);

  await publishEvent("tracking.exception.raised", {
    tripId: input.tripId,
    exceptionType: input.type,
    severity: input.severity,
    message: input.message,
    timestamp: exception.created_at.toISOString(),
  });

  return exception;
}

export async function resolveException(
  exceptionId: string
): Promise<TripException> {
  const result = await pool.query(
    `UPDATE trip_exceptions
        SET resolved = TRUE,
            resolved_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [exceptionId]
  );

  if (!result.rows.length) {
    throw new Error(`Exception ${exceptionId} not found`);
  }

  const exception = mapExceptionRow(result.rows[0]);

  await publishEvent("tracking.exception.resolved", {
    tripId: exception.trip_id,
    exceptionId,
    timestamp: exception.resolved_at?.toISOString?.(),
  });

  return exception;
}

export async function getActiveExceptions(
  tripId: string
): Promise<TripException[]> {
  const result = await pool.query(
    `SELECT * FROM trip_exceptions
      WHERE trip_id = $1 AND resolved = FALSE
      ORDER BY created_at DESC`,
    [tripId]
  );
  return result.rows.map(mapExceptionRow);
}
