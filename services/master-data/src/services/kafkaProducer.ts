import { Kafka, Producer } from 'kafkajs';
import { config } from '../config/config';

const kafka = new Kafka({
  clientId: 'master-data-service',
  brokers: [config.kafkaBroker],
});

export const kafkaProducer: Producer = kafka.producer();


export async function connectProducer(): Promise<void> {
  await kafkaProducer.connect();
  console.log('Kafka producer connected');
}

export async function disconnectProducer(): Promise<void> {
  await kafkaProducer.disconnect();
  console.log('Kafka producer disconnected');
}
