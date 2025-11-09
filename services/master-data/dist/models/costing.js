"use strict";
// Costing models for comprehensive cost calculation and margin analysis
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostComponentType = exports.OrderDirection = exports.OOZone = exports.DriverType = void 0;
var DriverType;
(function (DriverType) {
    DriverType["COMPANY"] = "COM";
    DriverType["RENTAL"] = "RNR";
    DriverType["OWNER_OPERATOR"] = "OO";
})(DriverType || (exports.DriverType = DriverType = {}));
var OOZone;
(function (OOZone) {
    OOZone["ZONE1"] = "ZONE1";
    OOZone["ZONE2"] = "ZONE2";
    OOZone["ZONE3"] = "ZONE3";
})(OOZone || (exports.OOZone = OOZone = {}));
var OrderDirection;
(function (OrderDirection) {
    OrderDirection["INBOUND"] = "INBOUND";
    OrderDirection["OUTBOUND"] = "OUTBOUND";
})(OrderDirection || (exports.OrderDirection = OrderDirection = {}));
var CostComponentType;
(function (CostComponentType) {
    CostComponentType["FIXED_WEEKLY"] = "FIXED_WEEKLY";
    CostComponentType["WAGE_CPM"] = "WAGE_CPM";
    CostComponentType["ROLLING_CPM"] = "ROLLING_CPM";
    CostComponentType["ACCESSORIAL"] = "ACCESSORIAL";
})(CostComponentType || (exports.CostComponentType = CostComponentType = {}));
