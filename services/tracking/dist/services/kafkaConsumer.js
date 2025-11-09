"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConsumer = startConsumer;
exports.stopConsumer = stopConsumer;
const kafkajs_1 = require("kafkajs");
const config_1 = require("../config/config");
const kafka = new kafkajs_1.Kafka({
    clientId: config_1.SERVICE_NAME,
    brokers: [config_1.KAFKA_BROKER],
});
const consumer = kafka.consumer({ groupId: config_1.KAFKA_GROUP_ID });
let isConnected = false;
async function startConsumer(topics, handler) {
    if (!isConnected) {
        await consumer.connect();
        isConnected = true;
    }
    for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: false });
    }
    consumer
        .run({
        eachMessage: async (payload) => {
            try {
                await handler(payload);
            }
            catch (error) {
                console.error("Consumer handler error", error);
            }
        },
    })
        .catch((error) => {
        console.error("Kafka consumer run failure", error);
    });
}
async function stopConsumer() {
    if (isConnected) {
        await consumer.disconnect();
        isConnected = false;
    }
}
process.on("SIGTERM", () => stopConsumer());
process.on("SIGINT", () => stopConsumer());
