import dotenv from "dotenv";

dotenv.config();

export const SERVICE_NAME = "tracking-service";

export const PORT = Number(process.env.PORT || 4004);

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@postgres:5432/fleet";

export const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:29092";

export const KAFKA_GROUP_ID =
  process.env.KAFKA_GROUP_ID || `${SERVICE_NAME}-consumer-group`;

export const DEFAULT_LOCATION_SOURCE = "telematics";

export const DEFAULT_PING_INTERVAL_SECONDS = Number(
  process.env.DEFAULT_PING_INTERVAL_SECONDS || 300
);

export const LATE_THRESHOLD_MINUTES = Number(
  process.env.LATE_THRESHOLD_MINUTES || 15
);

export const PICKUP_DWELL_ALERT_MINUTES = Number(
  process.env.PICKUP_DWELL_ALERT_MINUTES || 60
);

export const DELIVERY_DWELL_ALERT_MINUTES = Number(
  process.env.DELIVERY_DWELL_ALERT_MINUTES || 90
);

export const SPEED_SMOOTHING_WINDOW = Number(
  process.env.SPEED_SMOOTHING_WINDOW || 5
);
