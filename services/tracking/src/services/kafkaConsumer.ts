import { Kafka, EachMessagePayload } from "kafkajs";
import { KAFKA_BROKER, KAFKA_GROUP_ID, SERVICE_NAME } from "../config/config";

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

const kafka = new Kafka({
  clientId: SERVICE_NAME,
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

let isConnected = false;

export async function startConsumer(
  topics: string[],
  handler: MessageHandler
) {
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
        } catch (error) {
          console.error("Consumer handler error", error);
        }
      },
    })
    .catch((error) => {
      console.error("Kafka consumer run failure", error);
    });
}

export async function stopConsumer() {
  if (isConnected) {
    await consumer.disconnect();
    isConnected = false;
  }
}

process.on("SIGTERM", () => stopConsumer());
process.on("SIGINT", () => stopConsumer());
