"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarginGauge } from "@/components/margin-gauge";

interface BusinessRule {
  rule_key: string;
  scope: string;
  rule_value: string;
  unit: string;
  severity: string;
  description: string;
}

interface MarginCalculatorProps {
  revenue: number;
  totalCost: number;
  totalCpm: number;
  miles: number;
  className?: string;
}

export function MarginCalculator({
  revenue,
  totalCost,
  totalCpm,
  miles,
  className = "",
}: MarginCalculatorProps) {
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  useEffect(() => {
    // Fetch business rules from database
    const fetchRules = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MASTER_DATA_SERVICE_URL || "http://localhost:4001"}/query`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sql: "SELECT * FROM business_rules WHERE scope IN ('trip', 'booking') ORDER BY severity DESC",
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setBusinessRules(data.rows || []);
        }
      } catch (err) {
        console.error("Failed to fetch business rules:", err);
      } finally {
        setIsLoadingRules(false);
      }
    };

    fetchRules();
  }, []);

  // Calculate margin
  const marginDollars = revenue - totalCost;
  const marginPercent = revenue > 0 ? (marginDollars / revenue) * 100 : 0;

  // Evaluate guardrails
  const violations: Array<{
    rule: string;
    severity: string;
    message: string;
    actual: number;
    threshold: number;
  }> = [];

  businessRules.forEach((rule) => {
    const threshold = parseFloat(rule.rule_value);

    if (rule.rule_key === "min_margin_threshold" && marginPercent < threshold) {
      violations.push({
        rule: rule.rule_key,
        severity: rule.severity,
        message: `Margin below minimum threshold (${threshold}%)`,
        actual: marginPercent,
        threshold,
      });
    }

    if (rule.rule_key === "target_margin" && marginPercent < threshold) {
      violations.push({
        rule: rule.rule_key,
        severity: rule.severity,
        message: `Margin below target (${threshold}%)`,
        actual: marginPercent,
        threshold,
      });
    }

    if (rule.rule_key === "max_cost_per_mile" && totalCpm > threshold) {
      violations.push({
        rule: rule.rule_key,
        severity: rule.severity,
        message: `Cost per mile exceeds maximum ($${threshold})`,
        actual: totalCpm,
        threshold,
      });
    }
  });

  const hasCriticalViolations = violations.some((v) => v.severity === "critical");
  const hasWarnings = violations.some((v) => v.severity === "warning");

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-rose-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-rose-500/30 bg-rose-500/10 text-rose-400";
      case "warning":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      case "info":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";
      default:
        return "border-neutral-500/30 bg-neutral-500/10 text-neutral-400";
    }
  };

  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Margin & Guardrails</h3>
      </div>

      {/* Margin Display */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Projected Margin</span>
          <span
            className={`text-xl font-bold ${
              marginPercent >= 15
                ? "text-emerald-400"
                : marginPercent >= 8
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {marginPercent.toFixed(1)}%
          </span>
        </div>
        <MarginGauge margin={marginPercent} size="lg" />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-neutral-500">Revenue: ${revenue.toFixed(2)}</span>
          <span className="text-neutral-500">Cost: ${totalCost.toFixed(2)}</span>
        </div>
        <div className="mt-1 text-center text-sm font-semibold text-white">
          Profit: ${marginDollars.toFixed(2)}
        </div>
      </div>

      {/* Guardrail Violations */}
      {!isLoadingRules && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wide text-neutral-500">Business Rules</h4>
            {violations.length === 0 ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                All checks passed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-rose-400">
                <AlertTriangle className="h-3 w-3" />
                {violations.length} issue{violations.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {violations.length > 0 && (
            <div className="space-y-2">
              {violations.map((violation, idx) => (
                <div key={idx} className={`rounded-lg border px-3 py-2 ${getSeverityColor(violation.severity)}`}>
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(violation.severity)}
                    <div className="flex-1">
                      <p className="text-xs font-medium">{violation.message}</p>
                      <p className="mt-1 text-[10px] opacity-80">
                        Current: {violation.actual.toFixed(2)} | Threshold: {violation.threshold.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {violations.length === 0 && businessRules.length > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              <p>✓ All business rules satisfied</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Recommendation */}
      {hasCriticalViolations && (
        <div className="mt-3 rounded-lg border border-rose-500/50 bg-rose-500/20 p-3">
          <p className="text-xs font-semibold text-rose-300">⚠ Booking Not Recommended</p>
          <p className="mt-1 text-[10px] text-rose-400">Critical business rule violations detected</p>
        </div>
      )}

      {!hasCriticalViolations && hasWarnings && (
        <div className="mt-3 rounded-lg border border-amber-500/50 bg-amber-500/20 p-3">
          <p className="text-xs font-semibold text-amber-300">⚠ Proceed with Caution</p>
          <p className="mt-1 text-[10px] text-amber-400">Some warnings present - review before booking</p>
        </div>
      )}

      {!hasCriticalViolations && !hasWarnings && violations.length === 0 && (
        <div className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-500/20 p-3">
          <p className="text-xs font-semibold text-emerald-300">✓ Ready to Book</p>
          <p className="mt-1 text-[10px] text-emerald-400">All guardrails satisfied</p>
        </div>
      )}
    </Card>
  );
}
