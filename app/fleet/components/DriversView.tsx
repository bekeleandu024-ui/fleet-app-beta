import { mockDrivers } from "../mockData";
import { DriverCard } from "./DriverCard";

export function DriversView() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mockDrivers.map((driver) => (
        <DriverCard key={driver.id} driver={driver} />
      ))}
    </div>
  );
}
