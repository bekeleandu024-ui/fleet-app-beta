"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  PlayCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionBanner } from "@/components/section-banner";
import { StatChip } from "@/components/stat-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchEventsMasterData } from "@/lib/api";
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
  
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.events,
    queryFn: fetchEventsMasterData,
  });

  if (isLoading && !data) {
    return <MasterDataSkeleton />;
  }

  if (isError || !data) {
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

  const eventTypes: EventType[] = (data as any).event_types?.types || [];
  const eventRules: EventRule[] = (data as any).event_rules?.rules || [];

  const totalCostImpact = eventTypes.reduce((sum, event) => sum + (event.cost_per_event || 0), 0);
  const automaticEvents = eventTypes.filter(e => e.is_automatic).length;

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
