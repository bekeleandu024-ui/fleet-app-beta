import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Unit } from "../types";
import { Truck, Wrench, DollarSign, User, BarChartHorizontal } from "lucide-react";

interface UnitDetailProps {
  unit: Unit;
}

export function UnitDetail({ unit }: UnitDetailProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="md:col-span-1 space-y-6">
        {/* Overview */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/60">
          <h3 className="font-bold text-lg text-white mb-3 flex items-center"><Truck className="mr-2 h-5 w-5 text-cyan-400" /> Overview</h3>
          <div className="space-y-2 text-sm">
            <p><strong className="text-gray-400">VIN:</strong> {unit.overview.vin}</p>
            <p><strong className="text-gray-400">Plate:</strong> {unit.overview.licensePlate}</p>
            <p><strong className="text-gray-400">Capacity:</strong> {unit.overview.capacity}</p>
            <p><strong className="text-gray-400">Ownership:</strong> {unit.overview.ownership}</p>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/60">
          <h3 className="font-bold text-lg text-white mb-3 flex items-center"><Wrench className="mr-2 h-5 w-5 text-cyan-400" /> Maintenance</h3>
          <div className="space-y-2 text-sm">
            <p><strong className="text-gray-400">Next Service:</strong> {unit.maintenance.nextService}</p>
            <div className="pt-2 mt-2 border-t border-gray-700">
                <p className="text-xs text-yellow-400/80 bg-yellow-900/30 p-2 rounded-md">
                    <strong>AI Prediction:</strong> {unit.aiMaintenancePredictor}
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* Center Column */}
      <div className="md:col-span-2 space-y-6">
        <Tabs defaultValue="costs" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border-gray-700/60">
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="telematics">Telematics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="costs" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
            <h4 className="font-semibold text-md text-white mb-3 flex items-center"><DollarSign className="mr-2 h-4 w-4" /> Cost Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong className="text-gray-400 block">Weekly Fixed:</strong> ${unit.costs.weeklyFixed.toLocaleString()}</p>
                <p><strong className="text-gray-400 block">Cost Per Mile:</strong> ${unit.costs.cpm.toFixed(2)}</p>
            </div>
          </TabsContent>
          <TabsContent value="assignments" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
             <h4 className="font-semibold text-md text-white mb-3 flex items-center"><User className="mr-2 h-4 w-4" /> Assignment</h4>
             <p><strong className="text-gray-400">Current Driver:</strong> {unit.driverName || "Unassigned"}</p>
          </TabsContent>
          <TabsContent value="telematics" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
            <h4 className="font-semibold text-md text-white mb-3 flex items-center"><BarChartHorizontal className="mr-2 h-4 w-4" /> Telematics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong className="text-gray-400 block">Fuel Efficiency:</strong> {unit.telematics.fuelEfficiency} MPG</p>
                <p><strong className="text-gray-400 block">Idle Time:</strong> {unit.telematics.idleTime}%</p>
                <p><strong className="text-gray-400 block">Hard Braking:</strong> {unit.telematics.hardBrakingEvents}</p>
                <p><strong className="text-gray-400 block">Speed Violations:</strong> {unit.telematics.speedViolations}</p>
            </div>
             <div className="pt-3 mt-3 border-t border-gray-700">
                <p className="text-xs text-cyan-400/80 bg-cyan-900/30 p-2 rounded-md">
                    <strong>AI Coaching:</strong> Recommend reducing idle time to improve fuel efficiency.
                </p>
            </div>
          </TabsContent>
          <TabsContent value="history" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
            <h4 className="font-semibold text-md text-white mb-3">Maintenance History</h4>
            <p className="text-sm text-gray-400">Maintenance history would be listed here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
