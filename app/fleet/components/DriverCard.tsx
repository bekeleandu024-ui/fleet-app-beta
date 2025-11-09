
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
  import { Driver } from "../types";
  import Image from "next/image";
  import { MapPin, Truck, TrendingUp, Star, User, Calendar, Clock, Fuel, BarChart } from "lucide-react";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { DriverDetail } from "./DriverDetail";
  
  interface DriverCardProps {
    driver: Driver;
  }
  
  const statusStyles = {
    available: "bg-green-500/20 text-green-400 border-green-500/30",
    "on-trip": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "off-duty": "bg-gray-500/20 text-gray-400 border-gray-500/30",
    "hos-break": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  
  export function DriverCard({ driver }: DriverCardProps) {
    return (
      <Dialog>
        <Card className="bg-gray-800/30 border-gray-700/50 text-gray-300 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src={driver.avatar}
                  alt={driver.name}
                  width={64}
                  height={64}
                  className="rounded-full border-2 border-gray-600"
                />
                <div>
                  <CardTitle className="text-lg font-bold text-white">{driver.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-400">
                    ID: {driver.id}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs border-gray-600">
                {driver.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <Badge className={statusStyles[driver.status]}>
                {driver.status.replace("-", " ")}
              </Badge>
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin size={12} />
                <span>{driver.location}</span>
              </div>
            </div>
  
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Assigned Unit</span>
                <span className="font-medium text-white">{driver.unitId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">On-Time %</span>
                <span className="font-medium text-white">{driver.stats.onTimePercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg. Margin</span>
                <span className="font-medium text-white">{driver.stats.avgMargin}%</span>
              </div>
            </div>
  
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-white">AI Score</span>
                <span className="text-sm font-bold text-cyan-400">{driver.aiScore}/100</span>
              </div>
              <Progress value={driver.aiScore} className="h-2 [&>div]:bg-cyan-400" />
              <p className="text-xs text-gray-500 mt-1">Driver efficiency rating</p>
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
            <DialogTitle className="text-2xl">Driver Details</DialogTitle>
            <DialogDescription>
              Comprehensive overview for {driver.name}.
            </DialogDescription>
          </DialogHeader>
          <DriverDetail driver={driver} />
        </DialogContent>
      </Dialog>
    );
  }
  