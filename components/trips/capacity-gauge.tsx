import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

interface CapacityGaugeProps {
  currentWeight: number;
  maxWeight: number;
  currentCube: number;
  maxCube: number;
  currentLinearFeet: number;
  maxLinearFeet: number;
  utilizationPercent: number;
  limitingFactor?: string;
}

export function CapacityGauge({
  currentWeight,
  maxWeight,
  currentCube,
  maxCube,
  currentLinearFeet,
  maxLinearFeet,
  utilizationPercent,
  limitingFactor
}: CapacityGaugeProps) {
  const weightPct = Math.min(100, (currentWeight / maxWeight) * 100);
  const cubePct = Math.min(100, (currentCube / maxCube) * 100);
  const linearPct = Math.min(100, (currentLinearFeet / maxLinearFeet) * 100);

  const getStatusColor = (pct: number) => {
    if (pct > 100) return "bg-red-500";
    if (pct > 90) return "bg-orange-500";
    if (pct > 70) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <Card className="p-4 bg-zinc-900/50 border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-zinc-200">Capacity Utilization</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-zinc-100">{Math.round(utilizationPercent)}%</div>
          {limitingFactor && (
            <div className="text-xs text-zinc-500">Limited by {limitingFactor}</div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Weight */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Weight</span>
            <span className="text-zinc-300">
              {currentWeight.toLocaleString()} / {maxWeight.toLocaleString()} lbs
            </span>
          </div>
          <Progress value={weightPct} className="h-2 bg-zinc-800" indicatorClassName={getStatusColor(weightPct)} />
        </div>

        {/* Cube */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Cube</span>
            <span className="text-zinc-300">
              {currentCube.toLocaleString()} / {maxCube.toLocaleString()} cu ft
            </span>
          </div>
          <Progress value={cubePct} className="h-2 bg-zinc-800" indicatorClassName={getStatusColor(cubePct)} />
        </div>

        {/* Linear Feet */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Linear Feet</span>
            <span className="text-zinc-300">
              {currentLinearFeet} / {maxLinearFeet} ft
            </span>
          </div>
          <Progress value={linearPct} className="h-2 bg-zinc-800" indicatorClassName={getStatusColor(linearPct)} />
        </div>
      </div>
    </Card>
  );
}
