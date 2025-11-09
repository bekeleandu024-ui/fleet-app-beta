import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { Progress } from "@/components/ui/progress";
  import { Unit } from "../types";
  import { Truck, Wrench, MapPin, User, Gauge } from "lucide-react";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { UnitDetail } from "./UnitDetail";
  
  interface UnitCardProps {
    unit: Unit;
  }
  
  const statusStyles = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    maintenance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "out-of-service": "bg-red-500/20 text-red-400 border-red-500/30",
  };
  
  export function UnitCard({ unit }: UnitCardProps) {
    const mileageSinceService = unit.mileage - (unit.maintenance.history[0]?.mileage || 0);
    const serviceInterval = 30000; // Example service interval
    const maintenanceProgress = Math.min((mileageSinceService / serviceInterval) * 100, 100);
  
    return (
      <Dialog>
        <Card className="bg-gray-800/30 border-gray-700/50 text-gray-300 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <Truck className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white">Unit {unit.id}</CardTitle>
                  <CardDescription className="text-sm text-gray-400">
                    {unit.year} {unit.make} {unit.model}
                  </CardDescription>
                </div>
              </div>
              <Badge className={statusStyles[unit.status]}>
                {unit.status.replace("-", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{unit.driverName || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{unit.location}</span>
                </div>
            </div>
  
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Mileage</span>
                <span className="font-medium text-white">{unit.mileage.toLocaleString()} mi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Service</span>
                <span className="font-medium text-white">{unit.lastService}</span>
              </div>
            </div>
  
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-white">Next Service Due</span>
                <span className="text-sm font-bold text-yellow-400">{100 - Math.round(maintenanceProgress)}%</span>
              </div>
              <Progress value={maintenanceProgress} className="h-2 [&>div]:bg-yellow-400" />
              <p className="text-xs text-yellow-400/80 bg-yellow-900/30 p-2 rounded-md mt-2">
                <strong>AI Prediction:</strong> {unit.aiMaintenancePredictor}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full bg-gray-700/50 border-gray-600 hover:bg-gray-700 text-white">
                View Details
              </Button>
            </DialogTrigger>
          </CardFooter>
        </Card>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Unit Details</DialogTitle>
            <DialogDescription>
              Comprehensive overview for Unit {unit.id}.
            </DialogDescription>
          </DialogHeader>
          <UnitDetail unit={unit} />
        </DialogContent>
      </Dialog>
    );
  }
  