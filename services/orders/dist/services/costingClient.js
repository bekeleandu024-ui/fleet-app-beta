"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOrderCost = calculateOrderCost;
exports.getCostBreakdown = getCostBreakdown;
exports.updateActualCost = updateActualCost;
const axios_1 = __importDefault(require("axios"));
const MASTER_DATA_URL = process.env.MASTER_DATA_URL || 'http://master-data:4001';
/**
 * Calculate cost for an order by calling master-data costing API
 */
async function calculateOrderCost(request) {
    try {
        const response = await axios_1.default.post(`${MASTER_DATA_URL}/api/costing/calculate`, request, {
            timeout: 10000, // 10 second timeout
        });
        return response.data;
    }
    catch (error) {
        console.error('Error calling costing API:', error.message);
        throw new Error(`Failed to calculate cost: ${error.message}`);
    }
}
/**
 * Get cost breakdown for an order
 */
async function getCostBreakdown(orderId) {
    try {
        const response = await axios_1.default.get(`${MASTER_DATA_URL}/api/costing/breakdown/${orderId}`, {
            timeout: 5000,
        });
        return response.data;
    }
    catch (error) {
        console.error('Error getting cost breakdown:', error.message);
        throw new Error(`Failed to get cost breakdown: ${error.message}`);
    }
}
/**
 * Update actual costs after trip completion
 */
async function updateActualCost(orderId, actualMiles, actualCost) {
    try {
        await axios_1.default.patch(`${MASTER_DATA_URL}/api/costing/actual/${orderId}`, { actual_miles: actualMiles, actual_cost: actualCost }, { timeout: 5000 });
    }
    catch (error) {
        console.error('Error updating actual costs:', error.message);
        throw new Error(`Failed to update actual costs: ${error.message}`);
    }
}
