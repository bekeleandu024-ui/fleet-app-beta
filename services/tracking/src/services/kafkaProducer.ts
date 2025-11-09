import { Kafka } from "kafkajs";
import { KAFKA_BROKER, SERVICE_NAME } from "../config/config";

const kafka = new Kafka({
  clientId: SERVICE_NAME,
  brokers: [KAFKA_BROKER],
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

export async function publishEvent(topic: string, message: any) {
  try {
    await ensureConnected();
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error("Kafka publish error", error);
  }
}

export async function disconnectProducer() {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
  }
}

process.on("SIGTERM", () => disconnectProducer());
process.on("SIGINT", () => disconnectProducer());
