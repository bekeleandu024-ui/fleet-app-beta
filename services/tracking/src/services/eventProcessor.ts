import { EachMessagePayload } from "kafkajs";
import { updateTripStatus, createTrip, getTripByDispatchId } from "./tripService";
import { TripStatus } from "../models/tracking";

interface DispatchAssignedEvent {
  dispatchId: string;
  orderId: string;
  driverId: string;
  unitId?: string;
  timestamp: string;
}

interface DispatchStatusChangedEvent {
  dispatchId: string;
  status: string;
  timestamp: string;
}

export async function handleKafkaMessage({ topic, message }: EachMessagePayload) {
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
  } catch (error) {
    console.error("Failed to process Kafka message", {
      topic,
      payloadText,
      error,
    });
  }
}

async function handleDispatchAssigned(event: DispatchAssignedEvent) {
  try {
    const existing = await getTripByDispatchId(event.dispatchId);
    if (existing) {
      return;
    }
    await createTrip({
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
  } catch (error) {
    console.error("Failed to auto-create trip from dispatch", error);
  }
}

async function handleDispatchStatusChanged(event: DispatchStatusChangedEvent) {
  const statusMap: Record<string, TripStatus | undefined> = {
    ASSIGNED: TripStatus.ASSIGNED,
    IN_PROGRESS: TripStatus.IN_TRANSIT,
    COMPLETED: TripStatus.COMPLETED,
    CANCELLED: TripStatus.CANCELLED,
  };

  const mapped = statusMap[event.status];
  if (!mapped) {
    return;
  }

  try {
    const trip = await getTripByDispatchId(event.dispatchId);
    if (!trip) {
      return;
    }

    await updateTripStatus(trip.id, mapped, {
      triggeredBy: "dispatch-service",
      reason: `Dispatch status changed to ${event.status}`,
    });
  } catch (error) {
    console.error("Failed to sync dispatch status", error);
  }
}
