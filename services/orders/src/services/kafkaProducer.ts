import { Kafka } from "kafkajs";
import { KAFKA_BROKER } from "../config/config";

const kafka = new Kafka({
  clientId: "orders-service",
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
    console.log(`Published to ${topic}:`, message);
  } catch (error) {
    console.error("Kafka publish error:", error);
    throw error;
  }
}

process.on("SIGTERM", async () => {
  if (isConnected) await producer.disconnect();
});
