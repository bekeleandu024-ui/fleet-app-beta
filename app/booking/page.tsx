"use client";

import { useState } from "react";
import { OrderSnapshot } from "./components/OrderSnapshot";
import { BookingRecommendationPanel } from "./components/BookingRecommendationPanel";
import { TripAssignmentForm, TripAssignment } from "./components/TripAssignmentForm";
import { QualifiedOrdersList } from "./components/QualifiedOrdersList";
import {
  MOCK_BOOKING_ORDER,
  MOCK_BOOKING_RECOMMENDATION,
  MOCK_DRIVER_OPTIONS,
  MOCK_UNIT_OPTIONS,
  MOCK_QUALIFIED_ORDERS,
} from "./mockData";

export default function BookingCenterPage() {
  const [activeOrder] = useState(MOCK_BOOKING_ORDER);
  const [selectedQualifiedOrder, setSelectedQualifiedOrder] = useState(
    MOCK_QUALIFIED_ORDERS[0].id
  );

  const handleBookTrip = (assignment: TripAssignment) => {
    console.log("Booking trip with assignment:", assignment);
    // In real app: POST to API, redirect to trips board, show success toast
    alert(
      `Trip booked!\nDriver: ${assignment.driverName}\nUnit: ${assignment.unitCode}\nRate: ${assignment.rate}`
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E6EAF2] mb-2">
          Trip Booking Control Center
        </h1>
        <p className="text-sm text-[#6C7484]">
          Prioritize qualified freight, confirm resources, and launch the trip
          without leaving the console.
        </p>
      </div>

      {/* Order Snapshot (Full Width) */}
      <div className="mb-6">
        <OrderSnapshot order={activeOrder} />
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Booking Recommendation */}
        <div className="col-span-3">
          <BookingRecommendationPanel recommendation={MOCK_BOOKING_RECOMMENDATION} />
        </div>

        {/* Center: Trip Assignment Form */}
        <div className="col-span-6">
          <TripAssignmentForm
            drivers={MOCK_DRIVER_OPTIONS}
            units={MOCK_UNIT_OPTIONS}
            recommendation={MOCK_BOOKING_RECOMMENDATION}
            onBook={handleBookTrip}
          />
        </div>

        {/* Right: Qualified Orders */}
        <div className="col-span-3">
          <QualifiedOrdersList
            orders={MOCK_QUALIFIED_ORDERS}
            activeOrderId={selectedQualifiedOrder}
            onOrderSelect={setSelectedQualifiedOrder}
          />
        </div>
      </div>
    </div>
  );
}
