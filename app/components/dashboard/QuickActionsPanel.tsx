"use client";

import { Plus, UserPlus, AlertCircle, Calculator } from "lucide-react";

interface QuickActionButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary" | "danger";
  subtitle?: string;
}

export default function QuickActionsPanel() {
  const handleCreateOrder = () => {
    console.log("Create new order clicked");
    // TODO: Open order creation modal with AI location suggestions
  };

  const handleAssignDriver = () => {
    console.log("Assign driver clicked");
    // TODO: Open driver assignment modal with AI recommendations
  };

  const handleEmergencyDispatch = () => {
    console.log("Emergency dispatch clicked");
    // TODO: Open emergency dispatch flow
  };

  const handleCostCalculator = () => {
    console.log("Cost calculator clicked");
    // TODO: Open cost calculator modal
  };

  const actions: QuickActionButton[] = [
    {
      label: "Create New Order",
      icon: <Plus className="h-5 w-5" />,
      onClick: handleCreateOrder,
      variant: "primary",
      subtitle: "AI location suggestions",
    },
    {
      label: "Assign Driver",
      icon: <UserPlus className="h-5 w-5" />,
      onClick: handleAssignDriver,
      variant: "secondary",
      subtitle: "AI-recommended matches",
    },
    {
      label: "Emergency Dispatch",
      icon: <AlertCircle className="h-5 w-5" />,
      onClick: handleEmergencyDispatch,
      variant: "danger",
      subtitle: "Urgent assignments",
    },
    {
      label: "Cost Calculator",
      icon: <Calculator className="h-5 w-5" />,
      onClick: handleCostCalculator,
      variant: "secondary",
      subtitle: "Quick estimate",
    },
  ];

  const getButtonStyles = (variant: QuickActionButton["variant"]) => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
      case "secondary":
        return "bg-card hover:bg-card/95 text-foreground border-border";
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white border-red-600";
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${getButtonStyles(
              action.variant
            )} hover:shadow-md`}
          >
            <div className="flex-shrink-0">{action.icon}</div>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{action.label}</div>
              {action.subtitle && (
                <div
                  className={`text-xs mt-0.5 ${
                    action.variant === "secondary"
                      ? "text-muted-foreground"
                      : "opacity-80"
                  }`}
                >
                  {action.subtitle}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Additional quick stats */}
      <div className="mt-6 border-t border-border pt-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="mt-1 text-xs text-muted-foreground">Pending Orders</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">8</p>
            <p className="mt-1 text-xs text-muted-foreground">Ready to Assign</p>
          </div>
        </div>
      </div>
    </div>
  );
}
