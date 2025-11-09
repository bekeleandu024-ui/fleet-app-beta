"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionType = exports.TripStatus = void 0;
// Trip lifecycle statuses
var TripStatus;
(function (TripStatus) {
    // Pre-trip
    TripStatus["PLANNED"] = "planned";
    TripStatus["ASSIGNED"] = "assigned";
    // Pickup phase
    TripStatus["EN_ROUTE_TO_PICKUP"] = "en_route_to_pickup";
    TripStatus["AT_PICKUP"] = "at_pickup";
    TripStatus["LOADING"] = "loading";
    TripStatus["DEPARTED_PICKUP"] = "departed_pickup";
    // In transit
    TripStatus["IN_TRANSIT"] = "in_transit";
    // Delivery phase
    TripStatus["EN_ROUTE_TO_DELIVERY"] = "en_route_to_delivery";
    TripStatus["AT_DELIVERY"] = "at_delivery";
    TripStatus["UNLOADING"] = "unloading";
    TripStatus["DELIVERED"] = "delivered";
    // Post-delivery
    TripStatus["COMPLETED"] = "completed";
    TripStatus["CLOSED"] = "closed";
    // Exceptions
    TripStatus["DELAYED"] = "delayed";
    TripStatus["CANCELLED"] = "cancelled";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
// Exception types
var ExceptionType;
(function (ExceptionType) {
    ExceptionType["LATE_TO_PICKUP"] = "late_to_pickup";
    ExceptionType["LATE_TO_DELIVERY"] = "late_to_delivery";
    ExceptionType["EXCESSIVE_DWELL"] = "excessive_dwell";
    ExceptionType["OFF_ROUTE"] = "off_route";
    ExceptionType["HOS_VIOLATION"] = "hos_violation";
    ExceptionType["BORDER_DELAY"] = "border_delay";
})(ExceptionType || (exports.ExceptionType = ExceptionType = {}));
