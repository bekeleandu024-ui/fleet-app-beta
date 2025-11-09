"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KAFKA_BROKER = exports.DATABASE_URL = void 0;
exports.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@postgres:5432/fleet";
exports.KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:29092";
