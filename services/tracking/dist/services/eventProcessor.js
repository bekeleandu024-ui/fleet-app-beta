"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleKafkaMessage = handleKafkaMessage;
const tripService_1 = require("./tripService");
const tracking_1 = require("../models/tracking");
async function handleKafkaMessage({ topic, message }) {
    if (!message.value) {
        return;
    }
    const payloadText = message.value.toString();
    try {
        const payload = JSON.parse(payloadText);
        switch (topic) {
            case "dispatch.assigned":
                await handleDispatchAssigned(payload);
                break;
            case "dispatch.status.changed":
                await handleDispatchStatusChanged(payload);
                break;
            default:
                break;
        }
    }
    catch (error) {
        console.error("Failed to process Kafka message", {
            topic,
            payloadText,
            error,
        });
    }
}
async function handleDispatchAssigned(event) {
    try {
        const existing = await (0, tripService_1.getTripByDispatchId)(event.dispatchId);
        if (existing) {
            return;
        }
        await (0, tripService_1.createTrip)({
            orderId: event.orderId,
            dispatchId: event.dispatchId,
            driverId: event.driverId,
            unitId: event.unitId,
            pickup: {
                location: "TBD Pickup",
            },
            delivery: {
                location: "TBD Delivery",
            },
            notes: "Auto-created from dispatch assignment",
        });
    }
    catch (error) {
        console.error("Failed to auto-create trip from dispatch", error);
    }
}
async function handleDispatchStatusChanged(event) {
    const statusMap = {
        ASSIGNED: tracking_1.TripStatus.ASSIGNED,
        IN_PROGRESS: tracking_1.TripStatus.IN_TRANSIT,
        COMPLETED: tracking_1.TripStatus.COMPLETED,
        CANCELLED: tracking_1.TripStatus.CANCELLED,
    };
    const mapped = statusMap[event.status];
    if (!mapped) {
        return;
    }
    try {
        const trip = await (0, tripService_1.getTripByDispatchId)(event.dispatchId);
        if (!trip) {
            return;
        }
        await (0, tripService_1.updateTripStatus)(trip.id, mapped, {
            triggeredBy: "dispatch-service",
            reason: `Dispatch status changed to ${event.status}`,
        });
    }
    catch (error) {
        console.error("Failed to sync dispatch status", error);
    }
}
