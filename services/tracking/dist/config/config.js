"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPEED_SMOOTHING_WINDOW = exports.DELIVERY_DWELL_ALERT_MINUTES = exports.PICKUP_DWELL_ALERT_MINUTES = exports.LATE_THRESHOLD_MINUTES = exports.DEFAULT_PING_INTERVAL_SECONDS = exports.DEFAULT_LOCATION_SOURCE = exports.KAFKA_GROUP_ID = exports.KAFKA_BROKER = exports.DATABASE_URL = exports.PORT = exports.SERVICE_NAME = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.SERVICE_NAME = "tracking-service";
exports.PORT = Number(process.env.PORT || 4004);
exports.DATABASE_URL = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@postgres:5432/fleet";
exports.KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:29092";
exports.KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || `${exports.SERVICE_NAME}-consumer-group`;
exports.DEFAULT_LOCATION_SOURCE = "telematics";
exports.DEFAULT_PING_INTERVAL_SECONDS = Number(process.env.DEFAULT_PING_INTERVAL_SECONDS || 300);
exports.LATE_THRESHOLD_MINUTES = Number(process.env.LATE_THRESHOLD_MINUTES || 15);
exports.PICKUP_DWELL_ALERT_MINUTES = Number(process.env.PICKUP_DWELL_ALERT_MINUTES || 60);
exports.DELIVERY_DWELL_ALERT_MINUTES = Number(process.env.DELIVERY_DWELL_ALERT_MINUTES || 90);
exports.SPEED_SMOOTHING_WINDOW = Number(process.env.SPEED_SMOOTHING_WINDOW || 5);
