"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { TripTicketCard } from "@/components/trip-ticket-card";
import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { fetchTrips } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export default function ClosedTripsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({ 
    queryKey: queryKeys.trips({ status: "closed" }), 
    queryFn: () => fetchTrips("closed") 
  });

  if (isLoading && !data) {
    return <TripsSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Closed Trips" subtitle="History of completed and closed trips." aria-live="polite">
        <p className="text-sm text-slate-400">Trips unavailable.</p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner
      title="Closed Trips"
      subtitle="History of completed and closed trips."
      aria-live="polite"
      actions={
        <Button 
          variant="outline" 
          onClick={() => router.push("/trips")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Active Trips
        </Button>
      }
    >
      <div className="mt-6 space-y-4">
        {data.data.map((trip) => (
          <TripTicketCard 
            key={trip.id} 
            trip={trip} 
            onClick={() => router.push(`/trips/${trip.id}`)}
          />
        ))}
        {data.data.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
            <p className="text-sm text-zinc-400">No closed trips found.</p>
          </div>
        )}
      </div>
    </SectionBanner>
  );
}

function TripsSkeleton() {
  return (
    <SectionBanner title="Closed Trips" subtitle="History of completed and closed trips." aria-live="polite">
      <div className="mt-6 h-64 w-full animate-pulse rounded-xl bg-slate-800/50" />
    </SectionBanner>
  );
}
