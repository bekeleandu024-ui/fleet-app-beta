"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Flag,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Plus,
  Edit,
  PlayCircle,
  Truck,
  Send
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionBanner } from "@/components/section-banner";
import { StatChip } from "@/components/stat-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchEventsMasterData, fetchAdminTrips, fetchEventTypes, createTripEvent } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";

interface EventType {
  event_id: string;
  event_code: string;
  event_name: string;
  cost_per_event: number;
  is_automatic: boolean;
  created_at: string;
}

interface EventRule {
  rule_id: string;
  event_code: string;
  event_name: string;
  trigger_type: string;
  trigger_condition: string;
}

const EVENT_ICONS: Record<string, any> = {
  START: PlayCircle,
  PICKUP: MapPin,
  LOADED: CheckCircle,
  BORDER: Flag,
  DELIVERY: CheckCircle,
  COMPLETE: Flag,
  DEFAULT: Activity
};

const EVENT_STATUS_MAP: Record<string, string> = {
  START: "In Transit",
  PICKUP_ARRIVE: "At Pickup",
  PICKUP_DEPART: "Loaded / En Route",
  BORDER_ARRIVE: "At Border",
  BORDER_CLEAR: "Crossed Border",
  DELIVERY_ARRIVE: "At Delivery",
  DELIVERY_COMPLETE: "Completed"
};

export default function EventsMasterDataPage() {
  const [selectedTab, setSelectedTab] = useState("types");
  const queryClient = useQueryClient();
  
  const [eventLogForm, setEventLogForm] = useState({
    tripId: "",
    eventType: "",
    note: "",
    location: "",
    triggeredBy: "Dispatcher",
  });
  const [successMessage, setSuccessMessage] = useState("");
  
  const { data: eventTypesData, isLoading, isError } = useQuery({
    queryKey: ["event-types"],
    queryFn: fetchEventTypes,
  });

  const { data: trips } = useQuery({
    queryKey: ["admin-trips"],
    queryFn: fetchAdminTrips,
  });

  const createEventMutation = useMutation({
    mutationFn: ({ tripId, payload }: { tripId: string; payload: any }) => 
      createTripEvent(tripId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      setSuccessMessage("Event logged successfully!");
      setEventLogForm({
        tripId: eventLogForm.tripId,
        eventType: "",
        note: "",
        location: "",
        triggeredBy: "Dispatcher",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  if (isLoading && !eventTypesData) {
    return <MasterDataSkeleton />;
  }

  if (isError || !eventTypesData) {
    return (
      <SectionBanner 
        title="Event Types & Tracking" 
        subtitle="Manage trip milestones and automatic cost triggers"
        aria-live="polite"
      >
        <p className="text-sm text-neutral-400">Events not available.</p>
      </SectionBanner>
    );
  }

  const eventTypes: EventType[] = eventTypesData || [];
  const eventRules: EventRule[] = [];

  const totalCostImpact = eventTypes.reduce((sum, event) => sum + (event.cost_per_event || 0), 0);
  const automaticEvents = eventTypes.filter(e => e.is_automatic).length;

  const handleEventLogSubmit = () => {
    const eventType = eventTypesData?.find((e) => e.event_code === eventLogForm.eventType);
    
    const payload = {
      note: `${eventType?.event_name || eventLogForm.eventType}: ${eventLogForm.note}`,
      triggeredBy: eventLogForm.triggeredBy,
      eventType: eventLogForm.eventType,
      location: eventLogForm.location || undefined,
    };

    createEventMutation.mutate({ tripId: eventLogForm.tripId, payload });
  };

  const selectedTrip = trips?.find((t) => t.id === eventLogForm.tripId);
  const selectedEventType = eventTypesData?.find((e) => e.event_code === eventLogForm.eventType);
  const isEventLogValid = !!eventLogForm.tripId && !!eventLogForm.eventType && !!eventLogForm.note;

  return (
    <SectionBanner 
      title="Event Types & Tracking" 
      subtitle="Trip milestones that drive status updates and cost calculations"
      aria-live="polite"
      actions={
        <Button size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Event Type
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Event Types</p>
                <p className="text-xl font-bold text-neutral-200">{eventTypes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Auto-Trigger</p>
                <p className="text-xl font-bold text-neutral-200">{automaticEvents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Active Rules</p>
                <p className="text-xl font-bold text-neutral-200">{eventRules.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total Cost Impact</p>
                <p className="text-xl font-bold text-neutral-200">${totalCostImpact.toFixed(0)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Panel */}
        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-300 mb-1">How Event Tracking Works</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Events are trip milestones (Start, Pickup, Border, Delivery) that drivers log via mobile app or dispatch records. 
                Each event automatically updates trip status and can trigger cost calculations in your costing engine. 
                As events flow in, you get real-time visibility without calling drivers, and costs are calculated automatically.
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="types">
              <Activity className="w-4 h-4 mr-2" />
              Event Types
            </TabsTrigger>
            <TabsTrigger value="log">
              <Send className="w-4 h-4 mr-2" />
              Log Events
            </TabsTrigger>
            <TabsTrigger value="workflow">
              <TrendingUp className="w-4 h-4 mr-2" />
              Status Workflow
            </TabsTrigger>
            <TabsTrigger value="costing">
              <DollarSign className="w-4 h-4 mr-2" />
              Cost Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-3">
            {eventTypes.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">No event types configured</p>
                <Button size="sm" variant="primary" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event Type
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {eventTypes.map((event) => {
                  const IconComponent = EVENT_ICONS[event.event_code] || EVENT_ICONS.DEFAULT;
                  return (
                    <Card key={event.event_id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-neutral-800">
                            <IconComponent className="w-5 h-5 text-neutral-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-neutral-200">
                                {event.event_name}
                              </h3>
                              <StatChip 
                                label={event.event_code} 
                                variant="default" 
                              />
                              {event.is_automatic && (
                                <StatChip 
                                  label="Auto" 
                                  variant="ok" 
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Cost: ${event.cost_per_event?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Added {formatDateTime(event.created_at)}</span>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">
                              Triggers: {EVENT_STATUS_MAP[event.event_code] || "Custom status update"}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="subtle">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="log" className="space-y-4">
            {successMessage && (
              <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-emerald-200">{successMessage}</span>
                </div>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-neutral-200 mb-4">Select Trip</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                        Active Trip <span className="text-rose-400">*</span>
                      </label>
                      <Select
                        value={eventLogForm.tripId}
                        onChange={(e) => {
                          setEventLogForm(prev => ({ ...prev, tripId: e.target.value }));
                          setSuccessMessage("");
                        }}
                      >
                        <option value="">Choose a trip</option>
                        {trips
                          ?.filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
                          .map((trip) => (
                            <option key={trip.id} value={trip.id}>
                              {trip.tripNumber} - {trip.driver} ({trip.pickup} → {trip.delivery})
                            </option>
                          ))}
                      </Select>
                    </div>

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
                </Card>

                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-neutral-200 mb-4">Event Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                        Event Type <span className="text-rose-400">*</span>
                      </label>
                      <Select
                        value={eventLogForm.eventType}
                        onChange={(e) => {
                          setEventLogForm(prev => ({ ...prev, eventType: e.target.value }));
                          setSuccessMessage("");
                        }}
                      >
                        <option value="">Select event type</option>
                        {eventTypesData?.map((event) => (
                          <option key={event.event_code} value={event.event_code}>
                            {event.event_name}
                            {event.cost_per_event > 0 && ` (+ $${event.cost_per_event})`}
                          </option>
                        ))}
                      </Select>
                    </div>

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

                    <div>
                      <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                        Location
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., Chicago IL, Border Crossing, Detroit MI"
                        value={eventLogForm.location}
                        onChange={(e) => setEventLogForm(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                        Event Notes <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows={4}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500"
                        placeholder="Add detailed event description..."
                        value={eventLogForm.note}
                        onChange={(e) => setEventLogForm(prev => ({ ...prev, note: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                        Triggered By <span className="text-rose-400">*</span>
                      </label>
                      <Select
                        value={eventLogForm.triggeredBy}
                        onChange={(e) => setEventLogForm(prev => ({ ...prev, triggeredBy: e.target.value }))}
                      >
                        <option value="Dispatcher">Dispatcher</option>
                        <option value="Driver">Driver</option>
                        <option value="System">System</option>
                        <option value="Customer">Customer</option>
                      </Select>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-neutral-200 mb-4">Event Logging</h3>

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

                    {eventLogForm.eventType && selectedEventType && (
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

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleEventLogSubmit}
                    disabled={!isEventLogValid || createEventMutation.isPending}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {createEventMutation.isPending ? "Logging Event..." : "Log Event"}
                  </Button>

                  {!isEventLogValid && (
                    <p className="mt-3 text-xs text-amber-400">
                      Please select a trip, event type, and add notes
                    </p>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-neutral-200 mb-4">Event → Status Flow</h3>
              <div className="space-y-3">
                {[
                  { event: "Trip Start", status: "In Transit", icon: PlayCircle, color: "blue" },
                  { event: "Arrived at Pickup", status: "At Pickup", icon: MapPin, color: "cyan" },
                  { event: "Left Pickup / Loaded", status: "Loaded / En Route", icon: CheckCircle, color: "emerald" },
                  { event: "Arrived at Border", status: "At Border", icon: Flag, color: "amber" },
                  { event: "Cleared Border", status: "Crossed Border", icon: CheckCircle, color: "emerald" },
                  { event: "Arrived at Delivery", status: "At Delivery", icon: MapPin, color: "purple" },
                  { event: "Delivery Complete", status: "Completed", icon: Flag, color: "green" }
                ].map((item, index) => {
                  const IconComp = item.icon;
                  return (
                    <div key={index} className="relative">
                      {index < 6 && (
                        <div className="absolute left-5 top-12 bottom-0 w-px bg-neutral-800" />
                      )}
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-${item.color}-500/10 shrink-0`}>
                          <IconComp className={`w-5 h-5 text-${item.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-200">{item.event}</p>
                          <p className="text-xs text-neutral-500">Updates trip to: <span className="text-neutral-400 font-medium">{item.status}</span></p>
                        </div>
                        <div className="text-right text-xs text-neutral-500">
                          Auto-trigger
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300 mb-1">Real-Time Visibility</h3>
                  <p className="text-xs text-neutral-400">
                    Dispatch and operations see trip progress automatically without calling drivers. 
                    The event timeline tells the complete story from start to delivery.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="costing" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-neutral-200 mb-4">Event-Triggered Costs</h3>
              <div className="space-y-3">
                {eventTypes.filter(e => e.cost_per_event > 0).map((event) => (
                  <div key={event.event_id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{event.event_name}</p>
                      <p className="text-xs text-neutral-500">
                        Automatically adds to trip cost when event is logged
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">
                        ${event.cost_per_event.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-500">per event</p>
                    </div>
                  </div>
                ))}
              </div>

              {eventTypes.filter(e => e.cost_per_event > 0).length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-8">
                  No cost triggers configured yet
                </p>
              )}
            </Card>

            <Card className="p-4 bg-purple-500/5 border-purple-500/20">
              <div className="flex gap-3">
                <DollarSign className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-2">Cost Breakdown Example</h3>
                  <div className="space-y-1 text-xs text-neutral-400">
                    <div className="flex justify-between">
                      <span>Base Linehaul (miles × CPM)</span>
                      <span className="text-neutral-300">$1,250.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Border Crossing Event</span>
                      <span className="text-neutral-300">$75.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Pickup Event</span>
                      <span className="text-neutral-300">$50.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Delivery Event</span>
                      <span className="text-neutral-300">$50.00</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-neutral-800 font-semibold">
                      <span className="text-neutral-200">Total Trip Cost</span>
                      <span className="text-emerald-400">$1,425.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SectionBanner>
  );
}

function MasterDataSkeleton() {
  return (
    <SectionBanner 
      title="Event Types & Tracking" 
      subtitle="Loading..." 
      aria-live="polite"
    >
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-900/50" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-neutral-900/50" />
      </div>
    </SectionBanner>
  );
}
