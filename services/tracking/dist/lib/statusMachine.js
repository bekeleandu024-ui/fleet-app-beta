"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canTransition = canTransition;
exports.compareStatusOrder = compareStatusOrder;
const tracking_1 = require("../models/tracking");
const statusOrder = [
    tracking_1.TripStatus.PLANNED,
    tracking_1.TripStatus.ASSIGNED,
    tracking_1.TripStatus.EN_ROUTE_TO_PICKUP,
    tracking_1.TripStatus.AT_PICKUP,
    tracking_1.TripStatus.LOADING,
    tracking_1.TripStatus.DEPARTED_PICKUP,
    tracking_1.TripStatus.IN_TRANSIT,
    tracking_1.TripStatus.EN_ROUTE_TO_DELIVERY,
    tracking_1.TripStatus.AT_DELIVERY,
    tracking_1.TripStatus.UNLOADING,
    tracking_1.TripStatus.DELIVERED,
    tracking_1.TripStatus.COMPLETED,
    tracking_1.TripStatus.CLOSED,
];
const allowedTransitions = {
    [tracking_1.TripStatus.PLANNED]: [tracking_1.TripStatus.ASSIGNED, tracking_1.TripStatus.CANCELLED],
    [tracking_1.TripStatus.ASSIGNED]: [tracking_1.TripStatus.EN_ROUTE_TO_PICKUP, tracking_1.TripStatus.CANCELLED],
    [tracking_1.TripStatus.EN_ROUTE_TO_PICKUP]: [tracking_1.TripStatus.AT_PICKUP, tracking_1.TripStatus.DELAYED],
    [tracking_1.TripStatus.AT_PICKUP]: [tracking_1.TripStatus.LOADING, tracking_1.TripStatus.DELAYED],
    [tracking_1.TripStatus.LOADING]: [tracking_1.TripStatus.DEPARTED_PICKUP, tracking_1.TripStatus.DELAYED],
    [tracking_1.TripStatus.DEPARTED_PICKUP]: [tracking_1.TripStatus.IN_TRANSIT, tracking_1.TripStatus.EN_ROUTE_TO_DELIVERY],
    [tracking_1.TripStatus.IN_TRANSIT]: [tracking_1.TripStatus.EN_ROUTE_TO_DELIVERY, tracking_1.TripStatus.DELAYED],
    [tracking_1.TripStatus.EN_ROUTE_TO_DELIVERY]: [tracking_1.TripStatus.AT_DELIVERY, tracking_1.TripStatus.DELAYED],
    [tracking_1.TripStatus.AT_DELIVERY]: [tracking_1.TripStatus.UNLOADING, tracking_1.TripStatus.DELAYED],
    [tracking_1.TripStatus.UNLOADING]: [tracking_1.TripStatus.DELIVERED, tracking_1.TripStatus.DELAYED],
    [tracking_1.TripStatus.DELIVERED]: [tracking_1.TripStatus.COMPLETED],
    [tracking_1.TripStatus.COMPLETED]: [tracking_1.TripStatus.CLOSED],
    [tracking_1.TripStatus.CLOSED]: [],
    [tracking_1.TripStatus.DELAYED]: [
        tracking_1.TripStatus.EN_ROUTE_TO_PICKUP,
        tracking_1.TripStatus.AT_PICKUP,
        tracking_1.TripStatus.LOADING,
        tracking_1.TripStatus.DEPARTED_PICKUP,
        tracking_1.TripStatus.IN_TRANSIT,
        tracking_1.TripStatus.EN_ROUTE_TO_DELIVERY,
        tracking_1.TripStatus.AT_DELIVERY,
        tracking_1.TripStatus.UNLOADING,
        tracking_1.TripStatus.DELIVERED,
        tracking_1.TripStatus.COMPLETED,
    ],
    [tracking_1.TripStatus.CANCELLED]: [],
};
function canTransition(current, next) {
    if (current === next) {
        return true;
    }
    const allowed = allowedTransitions[current] || [];
    return allowed.includes(next);
}
function compareStatusOrder(a, b) {
    return statusOrder.indexOf(a) - statusOrder.indexOf(b);
}
