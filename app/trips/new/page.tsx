"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle, MapPin, Clock, Truck, Activity } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchAdminTrips, fetchEventTypes, createTripEvent, type EventType } from "@/lib/api";
import { queryKeys } from "@/lib/query";

interface EventLogFormData {
  tripId: string;
  eventType: string;
  note: string;
  location: string;
  triggeredBy: string;
}

export default function LogTripEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<EventLogFormData>({
    tripId: "",
    eventType: "",
    note: "",
    location: "",
    triggeredBy: "Dispatcher",
  });

  const [successMessage, setSuccessMessage] = useState<string>("");

  const { data: trips } = useQuery({
    queryKey: ["admin-trips"],
    queryFn: fetchAdminTrips,
  });

  const { data: eventTypes } = useQuery({
    queryKey: ["event-types"],
    queryFn: fetchEventTypes,
  });

  const createEventMutation = useMutation({
    mutationFn: ({ tripId, payload }: { tripId: string; payload: any }) => 
      createTripEvent(tripId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      setSuccessMessage("Event logged successfully!");
      setFormData({
        tripId: formData.tripId,
        eventType: "",
        note: "",
        location: "",
        triggeredBy: "Dispatcher",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  const handleInputChange = (field: keyof EventLogFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
  };

  const handleTripSelect = (tripId: string) => {
    setFormData((prev) => ({ ...prev, tripId }));
    setSuccessMessage("");
  };

  const handleSubmit = () => {
    const eventType = eventTypes?.find((e) => e.event_code === formData.eventType);
    
    const payload = {
      note: `${eventType?.event_name || formData.eventType}: ${formData.note}`,
      triggeredBy: formData.triggeredBy,
      eventType: formData.eventType,
      location: formData.location || undefined,
    };

    createEventMutation.mutate({ tripId: formData.tripId, payload });
  };

  const isValid = !!formData.tripId && !!formData.eventType && !!formData.note;

  const selectedTrip = trips?.find((t) => t.id === formData.tripId);
  const selectedEventType = eventTypes?.find((e) => e.event_code === formData.eventType);

  return (
    <SectionBanner
      title="Log Trip Event"
      subtitle="Record milestone events for trip tracking"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="subtle" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {successMessage && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-200">{successMessage}</span>
            </div>
          )}

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Select Trip</h3>
              <div className="grid gap-4">
                <FormField label="Active Trip" required>
                  <Select value={formData.tripId} onChange={(e) => handleTripSelect(e.target.value)}>
                    <option value="">Choose a trip</option>
                    {trips
                      ?.filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
                      .map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.tripNumber} - {trip.driver} ({trip.pickup} → {trip.delivery})
                        </option>
                      ))}
                  </Select>
                </FormField>

                {selectedTrip && (
                  <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-neutral-500">Trip Details</span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                        {selectedTrip.status}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-400">Driver:</span>
                        <span className="text-neutral-200">{selectedTrip.driver}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-400">Unit:</span>
                        <span className="text-neutral-200">{selectedTrip.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-400">Route:</span>
                        <span className="text-neutral-200">
                          {selectedTrip.pickup} → {selectedTrip.delivery}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-400">ETA:</span>
                        <span className="text-neutral-200">{selectedTrip.eta}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Event Details</h3>
              <div className="grid gap-4">
                <FormField label="Event Type" required>
                  <Select
                    value={formData.eventType}
                    onChange={(e) => handleInputChange("eventType", e.target.value)}
                  >
                    <option value="">Select event type</option>
                    {eventTypes?.map((event) => (
                      <option key={event.event_code} value={event.event_code}>
                        {event.event_name}
                        {event.cost_per_event > 0 && ` (+ $${event.cost_per_event})`}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {selectedEventType && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="text-blue-200 font-medium">{selectedEventType.event_name}</p>
                        <p className="text-blue-300/80">
                          {selectedEventType.is_automatic
                            ? "Auto-triggered event"
                            : "Manual event"}
                        </p>
                        {selectedEventType.cost_per_event > 0 && (
                          <p className="text-blue-300/80">
                            Cost Impact: ${selectedEventType.cost_per_event}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <FormField label="Location">
                  <Input
                    type="text"
                    placeholder="e.g., Chicago IL, Border Crossing, Detroit MI"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </FormField>

                <FormField label="Event Notes" required>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500"
                    placeholder="Add detailed event description..."
                    value={formData.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                  />
                </FormField>

                <FormField label="Triggered By" required>
                  <Select
                    value={formData.triggeredBy}
                    onChange={(e) => handleInputChange("triggeredBy", e.target.value)}
                  >
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Driver">Driver</option>
                    <option value="System">System</option>
                    <option value="Customer">Customer</option>
                  </Select>
                </FormField>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">Event Logging</h3>

              <div className="space-y-4 mb-6">
                <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <p className="text-xs text-neutral-400 mb-2">Event tracking enables:</p>
                  <ul className="text-xs text-neutral-300 space-y-1">
                    <li>• Automatic trip status updates</li>
                    <li>• Cost calculations per event</li>
                    <li>• Real-time visibility</li>
                    <li>• Compliance documentation</li>
                  </ul>
                </div>

                {formData.eventType && selectedEventType && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-medium text-amber-200 mb-1">Impact Summary</p>
                    <p className="text-xs text-amber-300">
                      This event will {selectedEventType.is_automatic && "automatically "}
                      update the trip status
                      {selectedEventType.cost_per_event > 0 &&
                        ` and add $${selectedEventType.cost_per_event} to trip cost`}
                      .
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!isValid || createEventMutation.isPending}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {createEventMutation.isPending ? "Logging Event..." : "Log Event"}
                </Button>
              </div>

              {!isValid && (
                <p className="mt-3 text-xs text-amber-400">
                  Please select a trip, event type, and add notes
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </SectionBanner>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
