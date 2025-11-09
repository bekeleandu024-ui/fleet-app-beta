"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishEvent = publishEvent;
const kafkajs_1 = require("kafkajs");
const config_1 = require("../config/config");
const kafka = new kafkajs_1.Kafka({
    clientId: "dispatch-service",
    brokers: [config_1.KAFKA_BROKER],
});
const producer = kafka.producer();
let isConnected = false;
async function ensureConnected() {
    if (!isConnected) {
        await producer.connect();
        isConnected = true;
        console.log("Kafka producer connected");
    }
}
async function publishEvent(topic, message) {
    try {
        await ensureConnected();
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        console.log(`Published to ${topic}:`, message);
    }
    catch (error) {
        console.error("Kafka publish error:", error);
        throw error;
    }
}
process.on("SIGTERM", async () => {
    if (isConnected)
        await producer.disconnect();
});
