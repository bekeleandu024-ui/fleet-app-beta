import { mockUnits } from "../mockData";
import { UnitCard } from "./UnitCard";

export function UnitsView() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mockUnits.map((unit) => (
        <UnitCard key={unit.id} unit={unit} />
      ))}
    </div>
  );
}
