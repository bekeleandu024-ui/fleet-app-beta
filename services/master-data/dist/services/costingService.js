"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.costingService = exports.CostingService = void 0;
const client_1 = require("../db/client");
const costing_1 = require("../models/costing");
const kafkaProducer_1 = require("./kafkaProducer");
class CostingService {
    constructor() {
        this.rateCache = {};
    }
    /**
     * Calculate comprehensive cost for a trip
     */
    async calculateCost(request) {
        const client = await client_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 1. Get driver and unit profiles
            const { driver, unit } = await this.getDriverAndUnit(request.driver_id, request.unit_number);
            if (!driver) {
                throw new Error(`Driver not found: ${request.driver_id || request.unit_number}`);
            }
            // 2. Determine week start for fixed cost allocation
            const weekStart = request.week_start || this.getWeekStart(new Date());
            // 3. Auto-detect events based on rules
            const autoEvents = await this.detectEvents(request, client);
            // Merge manual and auto-detected events
            const borderCrossings = request.border_crossings ?? autoEvents.border_crossings;
            const dropHooks = request.drop_hooks ?? autoEvents.drop_hooks;
            const pickups = request.pickups ?? autoEvents.pickups;
            const deliveries = request.deliveries ?? autoEvents.deliveries;
            // 4. Calculate cost components
            const breakdown = await this.calculateBreakdown(driver, unit, request.miles, weekStart, borderCrossings, dropHooks, pickups, deliveries, client);
            // 5. Calculate totals
            const totalCpm = breakdown.fixed_weekly.fixed_cpm +
                breakdown.wage.effective_wage_cpm +
                breakdown.rolling.total_rolling_cpm +
                breakdown.accessorials.accessorial_cpm;
            const totalCost = totalCpm * request.miles;
            // 6. Margin analysis if revenue provided
            let marginAnalysis = undefined;
            let pricingSuggestions = undefined;
            if (request.revenue && request.revenue > 0) {
                marginAnalysis = this.calculateMarginAnalysis(request.revenue, totalCost, request.miles, totalCpm);
                pricingSuggestions = this.calculatePricingSuggestions(totalCpm, request.miles);
            }
            // 7. Build calculation formula for audit trail
            const calculationFormula = {
                driver: {
                    driver_id: driver.driver_id,
                    driver_name: driver.driver_name,
                    driver_type: driver.driver_type,
                    oo_zone: driver.oo_zone,
                },
                unit: unit ? {
                    unit_id: unit.unit_id,
                    unit_number: unit.unit_number,
                    total_weekly_cost: unit.total_weekly_cost,
                } : null,
                inputs: {
                    miles: request.miles,
                    direction: request.direction,
                    is_round_trip: request.is_round_trip ?? false,
                    week_start: weekStart,
                    events: {
                        border_crossings: borderCrossings,
                        drop_hooks: dropHooks,
                        pickups: pickups,
                        deliveries: deliveries,
                    },
                },
                breakdown,
                totals: {
                    total_cpm: totalCpm,
                    total_cost: totalCost,
                },
            };
            // 8. Store trip cost record
            const costId = await this.storeTripCost(request.order_id, driver.driver_id, unit?.unit_id, driver.driver_type, driver.oo_zone, request.miles, request.direction, request.is_round_trip ?? false, borderCrossings, dropHooks, pickups, deliveries, breakdown.fixed_weekly.fixed_cpm, breakdown.wage.effective_wage_cpm, breakdown.rolling.total_rolling_cpm, breakdown.accessorials.accessorial_cpm, totalCpm, totalCost, request.revenue, marginAnalysis, calculationFormula, client);
            // 9. Update week miles summary for fixed cost tracking
            await this.updateWeekMilesSummary(unit?.unit_number || driver.unit_number, weekStart, request.miles, client);
            await client.query('COMMIT');
            // 10. Publish cost calculated event to Kafka
            await this.publishCostCalculatedEvent(costId, request.order_id, totalCost, totalCpm);
            // 11. Build response
            const response = {
                cost_id: costId,
                order_id: request.order_id,
                total_cost: parseFloat(totalCost.toFixed(2)),
                total_cpm: parseFloat(totalCpm.toFixed(4)),
                breakdown,
                margin_analysis: marginAnalysis,
                pricing_suggestions: pricingSuggestions,
                auto_detected_events: autoEvents.details,
                calculation_formula: calculationFormula,
                calculated_at: new Date(),
            };
            return response;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get driver and unit profiles
     */
    async getDriverAndUnit(driverId, unitNumber) {
        let driver = null;
        let unit = null;
        if (driverId) {
            const driverResult = await client_1.pool.query('SELECT * FROM driver_profiles WHERE driver_id = $1 AND is_active = true', [driverId]);
            driver = driverResult.rows[0] || null;
        }
        if (unitNumber) {
            const unitResult = await client_1.pool.query('SELECT * FROM unit_profiles WHERE unit_number = $1 AND is_active = true', [unitNumber]);
            unit = unitResult.rows[0] || null;
            // If driver not found but unit has a driver, use that
            if (!driver && unit && unit.driver_id) {
                const driverResult = await client_1.pool.query('SELECT * FROM driver_profiles WHERE driver_id = $1 AND is_active = true', [unit.driver_id]);
                driver = driverResult.rows[0] || null;
            }
        }
        return { driver, unit };
    }
    /**
     * Auto-detect events based on rules
     */
    async detectEvents(request, client) {
        const details = [];
        let borderCrossings = 0;
        let dropHooks = 0;
        let pickups = 0;
        let deliveries = 0;
        // Get event rules
        const rulesResult = await client.query('SELECT * FROM event_rules WHERE EXISTS (SELECT 1 FROM event_types WHERE event_types.event_code = event_rules.event_code AND event_types.is_automatic = true)');
        for (const rule of rulesResult.rows) {
            const condition = rule.trigger_condition;
            // Border crossing detection (simple heuristic)
            if (rule.event_code === 'BC' && rule.trigger_type === 'BORDER_CROSSING') {
                if (this.detectBorderCrossing(request.origin, request.destination)) {
                    borderCrossings = 1;
                    const bcCost = await this.getEventCost('BC');
                    details.push({
                        event_code: 'BC',
                        event_name: 'Border Crossing',
                        quantity: 1,
                        cost_per_event: bcCost,
                        total_cost: bcCost,
                        detection_reason: 'Auto-detected based on origin/destination',
                    });
                }
            }
            // Pickup detection
            if (rule.event_code === 'PICKUP' && rule.trigger_type === 'ORDER_TYPE') {
                if (condition.order_types.includes(request.order_type)) {
                    pickups = condition.count || 1;
                    const pickupCost = await this.getEventCost('PICKUP');
                    details.push({
                        event_code: 'PICKUP',
                        event_name: 'Pickup Stop',
                        quantity: pickups,
                        cost_per_event: pickupCost,
                        total_cost: pickupCost * pickups,
                        detection_reason: `Auto-detected for order type: ${request.order_type}`,
                    });
                }
            }
            // Delivery detection
            if (rule.event_code === 'DELIVERY' && rule.trigger_type === 'ORDER_TYPE') {
                if (condition.order_types.includes(request.order_type)) {
                    deliveries = condition.count || 1;
                    const deliveryCost = await this.getEventCost('DELIVERY');
                    details.push({
                        event_code: 'DELIVERY',
                        event_name: 'Delivery Stop',
                        quantity: deliveries,
                        cost_per_event: deliveryCost,
                        total_cost: deliveryCost * deliveries,
                        detection_reason: `Auto-detected for order type: ${request.order_type}`,
                    });
                }
            }
        }
        return { border_crossings: borderCrossings, drop_hooks: dropHooks, pickups, deliveries, details };
    }
    /**
     * Simple border crossing detection heuristic
     */
    detectBorderCrossing(origin, destination) {
        if (!origin || !destination)
            return false;
        const o = origin.toUpperCase();
        const d = destination.toUpperCase();
        // Simple check: if one has USA/US and other has CANADA/CA
        const hasUS = (s) => s.includes('USA') || s.includes('US') || s.includes('UNITED STATES');
        const hasCA = (s) => s.includes('CANADA') || s.includes('CA') || s.includes('CANADIAN');
        return (hasUS(o) && hasCA(d)) || (hasCA(o) && hasUS(d));
    }
    /**
     * Get event cost from database
     */
    async getEventCost(eventCode) {
        const result = await client_1.pool.query('SELECT cost_per_event FROM event_types WHERE event_code = $1', [eventCode]);
        return result.rows[0]?.cost_per_event || 0;
    }
    /**
     * Calculate detailed cost breakdown
     */
    async calculateBreakdown(driver, unit, miles, weekStart, borderCrossings, dropHooks, pickups, deliveries, client) {
        // Load rates
        await this.loadRates();
        // 1. Fixed weekly costs
        const weeklyMiles = await this.getWeekMiles(unit?.unit_number || driver.unit_number, weekStart, client);
        const totalWeeklyMiles = weeklyMiles + miles; // include current trip
        const totalWeeklyCost = unit?.total_weekly_cost || 0;
        const fixedCpm = totalWeeklyMiles > 0 ? totalWeeklyCost / totalWeeklyMiles : 0;
        // 2. Wage CPM (with all adders)
        const baseCpm = await this.getBaseWageCpm(driver.driver_type, driver.oo_zone);
        const benefitsPct = this.rateCache['BENEFITS_PCT_GLOBAL'] || 0;
        const perfPct = this.rateCache['PERF_PCT_GLOBAL'] || 0;
        const safetyPct = this.rateCache['SAFETY_PCT_GLOBAL'] || 0;
        const stepPct = this.rateCache['STEP_PCT_GLOBAL'] || 0;
        const effectiveWageCpm = baseCpm * (1 + benefitsPct + perfPct + safetyPct + stepPct);
        // 3. Rolling CPM
        const fuelCpm = await this.getFuelCpm(driver.driver_type);
        const trkRmCpm = this.rateCache['TRK_RM_CPM_GLOBAL'] || 0;
        const trlRmCpm = this.rateCache['TRL_RM_CPM_GLOBAL'] || 0;
        const totalRollingCpm = fuelCpm + trkRmCpm + trlRmCpm;
        // 4. Accessorials
        const bcCost = borderCrossings * (this.rateCache['BC_PER_GLOBAL'] || 0);
        const dhCost = dropHooks * (this.rateCache['DH_PER_GLOBAL'] || 0);
        const pickupCost = pickups * (this.rateCache['PICK_PER_GLOBAL'] || 0);
        const deliveryCost = deliveries * (this.rateCache['DEL_PER_GLOBAL'] || 0);
        const totalAccessorialCost = bcCost + dhCost + pickupCost + deliveryCost;
        const accessorialCpm = miles > 0 ? totalAccessorialCost / miles : 0;
        return {
            fixed_weekly: {
                total_weekly_cost: totalWeeklyCost,
                weekly_miles: totalWeeklyMiles,
                fixed_cpm: parseFloat(fixedCpm.toFixed(4)),
                components: {
                    truck_weekly: unit?.truck_weekly_cost || 0,
                    trailer_weekly: unit?.trailer_weekly_cost || 0,
                    insurance_weekly: unit?.insurance_weekly_cost || 0,
                    isaac_weekly: unit?.isaac_weekly_cost || 0,
                    prepass_weekly: unit?.prepass_weekly_cost || 0,
                    sga_weekly: unit?.sga_weekly_cost || 0,
                    dtops_weekly: unit?.dtops_weekly_cost || 0,
                    misc_weekly: unit?.misc_weekly_cost || 0,
                },
            },
            wage: {
                base_cpm: parseFloat(baseCpm.toFixed(4)),
                benefits_pct: benefitsPct,
                performance_pct: perfPct,
                safety_pct: safetyPct,
                step_pct: stepPct,
                effective_wage_cpm: parseFloat(effectiveWageCpm.toFixed(4)),
            },
            rolling: {
                fuel_cpm: parseFloat(fuelCpm.toFixed(4)),
                truck_maintenance_cpm: parseFloat(trkRmCpm.toFixed(4)),
                trailer_maintenance_cpm: parseFloat(trlRmCpm.toFixed(4)),
                total_rolling_cpm: parseFloat(totalRollingCpm.toFixed(4)),
            },
            accessorials: {
                border_crossing_count: borderCrossings,
                border_crossing_cost: parseFloat(bcCost.toFixed(2)),
                drop_hook_count: dropHooks,
                drop_hook_cost: parseFloat(dhCost.toFixed(2)),
                pickup_count: pickups,
                pickup_cost: parseFloat(pickupCost.toFixed(2)),
                delivery_count: deliveries,
                delivery_cost: parseFloat(deliveryCost.toFixed(2)),
                total_accessorial_cost: parseFloat(totalAccessorialCost.toFixed(2)),
                accessorial_cpm: parseFloat(accessorialCpm.toFixed(4)),
            },
        };
    }
    /**
     * Load all rates into cache
     */
    async loadRates() {
        const result = await client_1.pool.query('SELECT rule_key, rule_type, rule_value FROM costing_rules WHERE is_active = true');
        for (const row of result.rows) {
            const key = `${row.rule_key}_${row.rule_type}`;
            this.rateCache[key] = parseFloat(row.rule_value);
        }
    }
    /**
     * Get base wage CPM considering OO zones
     */
    async getBaseWageCpm(driverType, ooZone) {
        if (driverType === costing_1.DriverType.OWNER_OPERATOR && ooZone) {
            const key = `BASE_WAGE_OO_${ooZone}`;
            if (this.rateCache[key])
                return this.rateCache[key];
        }
        const key = `BASE_WAGE_${driverType}`;
        return this.rateCache[key] || 0;
    }
    /**
     * Get fuel CPM by driver type
     */
    async getFuelCpm(driverType) {
        const key = `FUEL_CPM_${driverType}`;
        return this.rateCache[key] || 0;
    }
    /**
     * Get week miles for a unit
     */
    async getWeekMiles(unitNumber, weekStart, client) {
        const result = await client.query('SELECT total_miles FROM week_miles_summary WHERE unit_number = $1 AND week_start = $2', [unitNumber, weekStart]);
        return result.rows[0]?.total_miles || 0;
    }
    /**
     * Update week miles summary
     */
    async updateWeekMilesSummary(unitNumber, weekStart, miles, client) {
        await client.query(`INSERT INTO week_miles_summary (unit_number, week_start, total_miles, trip_count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (unit_number, week_start)
       DO UPDATE SET 
         total_miles = week_miles_summary.total_miles + $3,
         trip_count = week_miles_summary.trip_count + 1,
         updated_at = NOW()`, [unitNumber, weekStart, miles]);
    }
    /**
     * Calculate margin analysis
     */
    calculateMarginAnalysis(revenue, totalCost, miles, totalCpm) {
        const rpm = revenue / miles;
        const ppm = rpm - totalCpm;
        const profit = revenue - totalCost;
        const marginPct = revenue > 0 ? profit / revenue : 0;
        const isProfitable = profit > 0;
        const breakEvenRpm = totalCpm;
        return {
            revenue: parseFloat(revenue.toFixed(2)),
            rpm: parseFloat(rpm.toFixed(4)),
            ppm: parseFloat(ppm.toFixed(4)),
            profit: parseFloat(profit.toFixed(2)),
            margin_pct: parseFloat(marginPct.toFixed(4)),
            is_profitable: isProfitable,
            break_even_rpm: parseFloat(breakEvenRpm.toFixed(4)),
        };
    }
    /**
     * Calculate pricing suggestions
     */
    calculatePricingSuggestions(totalCpm, miles) {
        const minimumRpm = totalCpm; // break-even
        const targetRpm = totalCpm * 1.15; // 15% margin
        const recommendedPrice = targetRpm * miles;
        return {
            minimum_rpm: parseFloat(minimumRpm.toFixed(4)),
            target_rpm: parseFloat(targetRpm.toFixed(4)),
            recommended_price: parseFloat(recommendedPrice.toFixed(2)),
        };
    }
    /**
     * Store trip cost record
     */
    async storeTripCost(orderId, driverId, unitId, driverType, ooZone, miles, direction, isRoundTrip, borderCrossings, dropHooks, pickups, deliveries, fixedCpm, wageCpm, rollingCpm, accessorialCpm, totalCpm, totalCost, revenue, marginAnalysis, calculationFormula, client) {
        const result = await client.query(`INSERT INTO trip_costs (
        order_id, driver_id, unit_id, driver_type, oo_zone,
        miles, direction, is_round_trip,
        border_crossings, drop_hooks, pickups, deliveries,
        fixed_cpm, wage_cpm, rolling_cpm, accessorial_cpm, total_cpm,
        total_cost, revenue, rpm, ppm, profit, margin_pct, is_profitable,
        calculation_formula
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24,
        $25
      ) RETURNING cost_id`, [
            orderId, driverId, unitId, driverType, ooZone,
            miles, direction, isRoundTrip,
            borderCrossings, dropHooks, pickups, deliveries,
            fixedCpm, wageCpm, rollingCpm, accessorialCpm, totalCpm,
            totalCost, revenue,
            marginAnalysis?.rpm, marginAnalysis?.ppm, marginAnalysis?.profit,
            marginAnalysis?.margin_pct, marginAnalysis?.is_profitable,
            JSON.stringify(calculationFormula)
        ]);
        return result.rows[0].cost_id;
    }
    /**
     * Get week start (Sunday)
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day; // Sunday = 0
        return new Date(d.setDate(diff));
    }
    /**
     * Publish cost calculated event to Kafka
     */
    async publishCostCalculatedEvent(costId, orderId, totalCost, totalCpm) {
        try {
            await kafkaProducer_1.kafkaProducer.send({
                topic: 'cost.calculated',
                messages: [
                    {
                        key: orderId,
                        value: JSON.stringify({
                            cost_id: costId,
                            order_id: orderId,
                            total_cost: totalCost,
                            total_cpm: totalCpm,
                            calculated_at: new Date().toISOString(),
                        }),
                    },
                ],
            });
            console.log(`Published to cost.calculated: ${costId}`);
        }
        catch (error) {
            console.error('Failed to publish cost.calculated event:', error);
        }
    }
    /**
     * Get cost breakdown for an order
     */
    async getCostBreakdown(orderId) {
        const result = await client_1.pool.query('SELECT * FROM trip_costs WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [orderId]);
        if (result.rows.length === 0) {
            throw new Error(`No cost record found for order: ${orderId}`);
        }
        return result.rows[0];
    }
    /**
     * Update actual costs and calculate variance
     */
    async updateActualCost(orderId, actualMiles, actualCost) {
        const client = await client_1.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(`UPDATE trip_costs 
         SET actual_miles = $1,
             actual_cost = $2,
             variance = $2 - total_cost,
             variance_pct = CASE WHEN total_cost > 0 THEN ($2 - total_cost) / total_cost ELSE 0 END,
             updated_at = NOW()
         WHERE order_id = $3
         RETURNING cost_id, variance, variance_pct`, [actualMiles, actualCost, orderId]);
            if (result.rows.length > 0) {
                const { cost_id, variance, variance_pct } = result.rows[0];
                // Publish cost actual event
                await kafkaProducer_1.kafkaProducer.send({
                    topic: 'cost.actual',
                    messages: [
                        {
                            key: orderId,
                            value: JSON.stringify({
                                cost_id,
                                order_id: orderId,
                                actual_miles: actualMiles,
                                actual_cost: actualCost,
                                variance,
                                variance_pct,
                                updated_at: new Date().toISOString(),
                            }),
                        },
                    ],
                });
                console.log(`Published to cost.actual: ${cost_id}`);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.CostingService = CostingService;
exports.costingService = new CostingService();
