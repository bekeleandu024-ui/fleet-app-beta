"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Activity, 
  FileText, 
  Map as MapIcon, 
  Package, 
  User, 
  Truck, 
  Clock, 
  MapPin, 
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  Sparkles
} from "lucide-react";

import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { fetchTripDetail } from "@/lib/api";
import { getTripInsights } from "@/lib/ai-service";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";

const severityTone: Record<string, "default" | "warn" | "alert"> = {
  info: "default",
  warn: "warn",
  alert: "alert",
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripId = params?.id ?? "";
  const [noteText, setNoteText] = useState("");
  
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: () => fetchTripDetail(tripId),
    enabled: Boolean(tripId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: aiInsights, isLoading: aiLoading } = useQuery({
    queryKey: ['tripInsights', tripId],
    queryFn: () => getTripInsights(tripId),
    enabled: Boolean(tripId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    // TODO: Implement note creation API call
    console.log("Adding note:", noteText);
    setNoteText("");
    // queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) });
  };

  if (isLoading) {
    return <TripDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-sm text-neutral-500">
        Unable to load trip detail.
      </section>
    );
  }

  const getStatusVariant = (status: string) => {
    if (status.toLowerCase().includes("completed") || status.toLowerCase().includes("delivered")) return "ok";
    if (status.toLowerCase().includes("late") || status.toLowerCase().includes("risk")) return "warn";
    if (status.toLowerCase().includes("exception") || status.toLowerCase().includes("alert")) return "alert";
    return "default";
  };

  const latestEvent = data.timeline[0];
  const activeExceptions = data.exceptions.filter(e => e.severity === "alert" || e.severity === "warn");

  return (
    <>
      {/* Header with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="subtle" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-neutral-200">Trip {data.tripNumber}</h1>
            <p className="text-xs text-neutral-500">ID: {data.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatChip label={data.status} variant={getStatusVariant(data.status) as any} />
          {activeExceptions.length > 0 && (
            <StatChip label={`${activeExceptions.length} Exceptions`} variant="alert" />
          )}
          <Button size="sm" variant="primary">
            <Edit className="w-4 h-4 mr-2" />
            Update Status
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">ETA</p>
                <p className="text-sm font-semibold text-neutral-200">{formatDateTime(data.eta)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Last Location</p>
                <p className="text-sm font-semibold text-neutral-200">
                  {latestEvent?.location || "En Route"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Last Update</p>
                <p className="text-sm font-semibold text-neutral-200">
                  {formatDateTime(data.telemetry.lastPing)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Driver & Unit Info */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <Card className="p-3">
            <div className="flex items-start gap-2">
              <div className="p-2 rounded-lg bg-neutral-800">
                <User className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500">Driver</p>
                <p className="text-sm font-semibold text-neutral-200 mb-2">{data.driver}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="subtle" className="text-xs px-2 py-1">
                    <Phone className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" variant="subtle" className="text-xs px-2 py-1">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-start gap-2">
              <div className="p-2 rounded-lg bg-neutral-800">
                <Truck className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500">Unit</p>
                <p className="text-sm font-semibold text-neutral-200 mb-2">{data.unit}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="subtle" className="text-xs px-2 py-1">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="p-4">
        <Tabs defaultValue="ai-insights" className="space-y-4">
          <TabsList className="bg-neutral-900/50 text-neutral-500">
            <TabsTrigger value="ai-insights">
              <Sparkles className="size-4" /> AI Insights
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Activity className="size-4" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="exceptions">
              <FileText className="size-4" /> Exceptions
            </TabsTrigger>
            <TabsTrigger value="telemetry">
              <MapIcon className="size-4" /> Telemetry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-insights" className="space-y-4">
            {aiLoading ? (
              <div className="space-y-4">
                <div className="h-48 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
                <div className="h-64 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
              </div>
            ) : aiInsights ? (
              <>
                <AIInsightsPanel
                  recommendation={aiInsights.recommendation}
                  driverRecommendations={aiInsights.alternativeDrivers}
                  insights={aiInsights.insights}
                  totalDistance={aiInsights.routeOptimization.distance}
                  estimatedTime={aiInsights.routeOptimization.duration}
                />
                
                {/* Current Assignment Details */}
                <Card className="p-6">
                  <h3 className="font-semibold text-neutral-100 mb-4">Current Assignment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Driver</p>
                      <p className="text-sm font-semibold text-neutral-200">
                        {aiInsights.currentAssignment.driver}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Driver Type</p>
                      <p className="text-sm font-semibold text-neutral-200">
                        {aiInsights.currentAssignment.driverType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Unit</p>
                      <p className="text-sm font-semibold text-neutral-200">
                        {aiInsights.currentAssignment.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Effective Rate</p>
                      <p className="text-sm font-semibold text-neutral-200">
                        ${aiInsights.currentAssignment.effectiveRate}/mile
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Estimated Cost</p>
                      <p className="text-sm font-semibold text-neutral-200">
                        ${aiInsights.currentAssignment.estimatedCost}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Cost Breakdown */}
                <Card className="p-6">
                  <h3 className="font-semibold text-neutral-100 mb-4">Cost Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-400">Linehaul Cost</span>
                      <span className="text-sm font-semibold text-neutral-200">
                        ${aiInsights.costAnalysis.linehaulCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-400">Fuel Cost</span>
                      <span className="text-sm font-semibold text-neutral-200">
                        ${aiInsights.costAnalysis.fuelCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-400">Driver Cost</span>
                      <span className="text-sm font-semibold text-neutral-200">
                        ${aiInsights.costAnalysis.driverCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-neutral-800 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-neutral-200">Total Cost</span>
                      <span className="text-lg font-bold text-neutral-100">
                        ${aiInsights.costAnalysis.totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-400">Recommended Revenue</span>
                      <span className="text-sm font-semibold text-emerald-400">
                        ${aiInsights.costAnalysis.recommendedRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-400">Margin</span>
                      <span className="text-sm font-semibold text-emerald-400">
                        {aiInsights.costAnalysis.margin}%
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Route Optimization */}
                {aiInsights.routeOptimization.warnings.length > 0 && (
                  <Card className="p-6 bg-amber-500/5 border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-200 mb-2">Route Warnings</h3>
                        {aiInsights.routeOptimization.warnings.map((warning, idx) => (
                          <p key={idx} className="text-sm text-amber-300/90">
                            {warning.replace('⚠️', '').trim()}
                          </p>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No AI insights available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            {data.timeline.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No timeline events yet.</p>
            ) : (
              <div className="space-y-3">
                {data.timeline.map((event, index) => (
                  <div key={event.id} className="relative">
                    {index < data.timeline.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-px bg-neutral-800" />
                    )}
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border-2 border-neutral-900">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                      <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-neutral-200">{event.summary}</p>
                            {event.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-neutral-500" />
                                <p className="text-xs text-neutral-500">{event.location}</p>
                              </div>
                            )}
                          </div>
                          <StatChip label={event.status} variant="default" />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">{formatDateTime(event.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-3">
            {data.exceptions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No active exceptions</p>
                <p className="text-xs text-neutral-500">All systems normal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.exceptions.map((exception) => (
                  <div key={exception.id} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          exception.severity === "alert" ? "bg-red-500/10" :
                          exception.severity === "warn" ? "bg-amber-500/10" :
                          "bg-blue-500/10"
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            exception.severity === "alert" ? "text-red-400" :
                            exception.severity === "warn" ? "text-amber-400" :
                            "text-blue-400"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-200">{exception.type}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Opened {formatDateTime(exception.opened)} • {exception.owner}
                          </p>
                          {exception.notes && (
                            <p className="text-sm text-neutral-300 mt-2">{exception.notes}</p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="subtle" className="text-xs">
                              Resolve
                            </Button>
                            <Button size="sm" variant="subtle" className="text-xs">
                              Escalate
                            </Button>
                          </div>
                        </div>
                      </div>
                      <StatChip label={exception.severity.toUpperCase()} variant={severityTone[exception.severity]} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="telemetry" className="space-y-4">
            <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/30 p-8 text-center">
              <MapIcon className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Live route map</p>
              <p className="text-xs text-neutral-600">Map visualization coming soon</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-neutral-200 mb-3">Location History</h3>
              {data.telemetry.breadcrumb.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">No tracking data available</p>
              ) : (
                <div className="space-y-2">
                  {data.telemetry.breadcrumb.map((point) => (
                    <div key={point.id} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-neutral-500" />
                        <div>
                          <p className="text-sm text-neutral-200">{point.location || "Unknown"}</p>
                          <p className="text-xs text-neutral-500">{formatDateTime(point.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-200">{point.speed} mph</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </Card>

        {/* Add Note */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-neutral-200 mb-3">Add Note</h2>
          <textarea
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 resize-none"
            rows={3}
            placeholder="Add a note about this trip..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <Button 
            size="sm" 
            variant="primary" 
            className="w-full mt-2"
            disabled={!noteText.trim()}
            onClick={handleAddNote}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </Card>

        {/* Notes */}
        <Card className="p-4">
        <section>
          <h2 className="text-sm font-semibold text-neutral-200 mb-3">Notes</h2>
          {data.notes.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-4">No notes yet</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {data.notes.map((note) => (
                <li key={note.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                    <span className="font-medium">{note.author}</span>
                    <span>{formatDateTime(note.timestamp)}</span>
                  </div>
                  <p className="text-sm text-neutral-200">{note.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        </Card>

        {/* Attachments */}
        <Card className="p-4">
        <section>
          <h2 className="text-sm font-semibold text-neutral-200 mb-3">Attachments</h2>
          {data.attachments.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs text-neutral-500">No attachments</p>
              <Button size="sm" variant="subtle" className="mt-2">
                Upload File
              </Button>
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.attachments.map((file) => (
                <li key={file.id} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-200">{file.name}</span>
                  </div>
                  <span className="text-xs text-neutral-500">{file.size}</span>
                </li>
              ))}\n            </ul>
          )}
        </section>
        </Card>
      </div>
    </>
  );
}

function TripDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-[100px] animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      <div className="grid gap-3 grid-cols-3">
        <div className="h-20 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        <div className="h-20 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        <div className="h-20 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      </div>
      <div className="h-[400px] animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
    </div>
  );
}
