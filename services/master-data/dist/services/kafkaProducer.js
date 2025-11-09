"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafkaProducer = void 0;
exports.connectProducer = connectProducer;
exports.disconnectProducer = disconnectProducer;
const kafkajs_1 = require("kafkajs");
const config_1 = require("../config/config");
const kafka = new kafkajs_1.Kafka({
    clientId: 'master-data-service',
    brokers: [config_1.config.kafkaBroker],
});
exports.kafkaProducer = kafka.producer();
async function connectProducer() {
    await exports.kafkaProducer.connect();
    console.log('Kafka producer connected');
}
async function disconnectProducer() {
    await exports.kafkaProducer.disconnect();
    console.log('Kafka producer disconnected');
}
