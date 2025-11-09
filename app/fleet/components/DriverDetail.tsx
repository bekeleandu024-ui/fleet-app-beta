import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Driver } from "../types";
import { User, Calendar, Clock, BarChart, FileText, Map, ShipWheel } from "lucide-react";

interface DriverDetailProps {
  driver: Driver;
}

export function DriverDetail({ driver }: DriverDetailProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="md:col-span-1 space-y-6">
        {/* Profile */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/60">
          <h3 className="font-bold text-lg text-white mb-3 flex items-center"><User className="mr-2 h-5 w-5 text-cyan-400" /> Profile</h3>
          <div className="space-y-2 text-sm">
            <p><strong className="text-gray-400">License:</strong> {driver.profile.license}</p>
            <p><strong className="text-gray-400">Expires:</strong> {driver.profile.licenseExpiration}</p>
            <p><strong className="text-gray-400">Certs:</strong> {driver.profile.certifications.join(', ')}</p>
            <p><strong className="text-gray-400">Pay:</strong> {driver.profile.payStructure}</p>
            <div className="pt-2 mt-2 border-t border-gray-700">
                <p className="text-xs text-cyan-400/80 bg-cyan-900/30 p-2 rounded-md">
                    <strong>AI Insight:</strong> Top performer in Zone 2
                </p>
            </div>
          </div>
        </div>

        {/* HOS Tracking */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/60">
          <h3 className="font-bold text-lg text-white mb-3 flex items-center"><Clock className="mr-2 h-5 w-5 text-cyan-400" /> HOS Tracking</h3>
          <div className="space-y-2 text-sm">
            <p><strong className="text-gray-400">Drive Time:</strong> {driver.hos.driveTimeRemaining}</p>
            <p><strong className="text-gray-400">Cycle Time:</strong> {driver.hos.cycleTimeRemaining}</p>
            {driver.hos.predictedViolation && (
              <div className="pt-2 mt-2 border-t border-gray-700">
                <p className="text-xs text-yellow-400/80 bg-yellow-900/30 p-2 rounded-md">
                    <strong>AI Prediction:</strong> {driver.hos.predictedViolation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Column */}
      <div className="md:col-span-2 space-y-6">
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border-gray-700/60">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="current_trip">Current Trip</TabsTrigger>
            <TabsTrigger value="trip_history">Trip History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="performance" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
            <h4 className="font-semibold text-md text-white mb-3 flex items-center"><BarChart className="mr-2 h-4 w-4" /> Performance</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong className="text-gray-400 block">Weekly Revenue:</strong> ${driver.performance.weeklyRevenue.toLocaleString()}</p>
                <p><strong className="text-gray-400 block">Cost Per Mile:</strong> ${driver.performance.cpm.toFixed(2)}</p>
                <p><strong className="text-gray-400 block">Fuel Efficiency:</strong> {driver.performance.fuelEfficiency} MPG</p>
                <p><strong className="text-gray-400 block">On-Time %:</strong> {driver.stats.onTimePercentage}%</p>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-700">
                <p className="text-xs text-cyan-400/80 bg-cyan-900/30 p-2 rounded-md">
                    <strong>AI Insights:</strong> CPM is 5% better than fleet average. Recommend coaching on hard braking events.
                </p>
            </div>
          </TabsContent>
          <TabsContent value="current_trip" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
             <h4 className="font-semibold text-md text-white mb-3 flex items-center"><ShipWheel className="mr-2 h-4 w-4" /> Current Trip</h4>
            {driver.currentTrip ? (
                <div className="space-y-2 text-sm">
                    <p><strong className="text-gray-400">Trip ID:</strong> {driver.currentTrip.tripId}</p>
                    <p><strong className="text-gray-400">Destination:</strong> {driver.currentTrip.destination}</p>
                    <p><strong className="text-gray-400">HOS Remaining:</strong> {driver.currentTrip.hosRemaining}</p>
                    <p><strong className="text-gray-400">Next Action:</strong> {driver.currentTrip.nextAction}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-400">No active trip.</p>
            )}
          </TabsContent>
          <TabsContent value="trip_history" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
            <h4 className="font-semibold text-md text-white mb-3 flex items-center"><Calendar className="mr-2 h-4 w-4" /> Trip History</h4>
            <p className="text-sm text-gray-400">Trip history would be listed here.</p>
          </TabsContent>
          <TabsContent value="documents" className="bg-gray-800/50 p-4 rounded-b-lg border border-t-0 border-gray-700/60">
            <h4 className="font-semibold text-md text-white mb-3 flex items-center"><FileText className="mr-2 h-4 w-4" /> Documents</h4>
            <p className="text-sm text-gray-400">Documents would be listed here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
