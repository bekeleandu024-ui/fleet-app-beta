"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Command, 
  Loader2, 
  Package, 
  Truck, 
  Users, 
  MapPin,
  DollarSign,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: "order" | "trip" | "driver" | "action" | "insight";
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: () => void;
  href?: string;
}

interface AIInterpretation {
  interpretation: string;
  filters: Record<string, any>;
  summary: string;
}

export function AICommandBar({ isOpen, onClose }: CommandBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiInterpretation, setAiInterpretation] = useState<AIInterpretation | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setAiInterpretation(null);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAiInterpretation(null);
      return;
    }

    setIsLoading(true);

    try {
      // Call AI-powered search endpoint
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });

      if (response.ok) {
        const data = await response.json();
        setAiInterpretation(data.interpretation);
        setResults(data.results || []);
      } else {
        // Fallback to basic search
        setResults(getQuickActions(searchQuery));
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults(getQuickActions(searchQuery));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleSelectResult = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.href) {
      router.push(result.href);
    }
    onClose();
  };

  const getQuickActions = (q: string): SearchResult[] => {
    const lowerQuery = q.toLowerCase();
    const actions: SearchResult[] = [];

    // Order-related actions
    if (lowerQuery.includes("order") || lowerQuery.includes("shipment")) {
      actions.push({
        type: "action",
        id: "new-order",
        title: "Create New Order",
        subtitle: "Open enterprise order form",
        icon: <Package className="h-4 w-4 text-blue-400" />,
        href: "/orders/new/enterprise"
      });
      actions.push({
        type: "action",
        id: "view-orders",
        title: "View All Orders",
        subtitle: "Browse order list",
        icon: <Package className="h-4 w-4 text-zinc-400" />,
        href: "/orders"
      });
    }

    // Trip-related actions
    if (lowerQuery.includes("trip") || lowerQuery.includes("delivery") || lowerQuery.includes("late")) {
      actions.push({
        type: "action",
        id: "view-trips",
        title: "View Active Trips",
        subtitle: "Monitor in-transit shipments",
        icon: <Truck className="h-4 w-4 text-emerald-400" />,
        href: "/trips"
      });
    }

    // Dispatch actions
    if (lowerQuery.includes("dispatch") || lowerQuery.includes("assign") || lowerQuery.includes("driver")) {
      actions.push({
        type: "action",
        id: "dispatch",
        title: "Open Dispatch Board",
        subtitle: "Assign drivers to orders",
        icon: <Users className="h-4 w-4 text-purple-400" />,
        href: "/dispatch"
      });
    }

    // Map actions
    if (lowerQuery.includes("map") || lowerQuery.includes("track") || lowerQuery.includes("location")) {
      actions.push({
        type: "action",
        id: "map",
        title: "Open Fleet Map",
        subtitle: "Real-time asset tracking",
        icon: <MapPin className="h-4 w-4 text-rose-400" />,
        href: "/map"
      });
    }

    // Cost/margin actions
    if (lowerQuery.includes("cost") || lowerQuery.includes("margin") || lowerQuery.includes("profit")) {
      actions.push({
        type: "action",
        id: "costing",
        title: "Costing Analysis",
        subtitle: "View cost breakdown",
        icon: <DollarSign className="h-4 w-4 text-amber-400" />,
        href: "/costing"
      });
    }

    // Analytics actions
    if (lowerQuery.includes("analytic") || lowerQuery.includes("report") || lowerQuery.includes("dashboard")) {
      actions.push({
        type: "action",
        id: "analytics",
        title: "View Analytics",
        subtitle: "Performance dashboards",
        icon: <Sparkles className="h-4 w-4 text-blue-400" />,
        href: "/analytics"
      });
    }

    return actions.slice(0, 8);
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.icon) return result.icon;
    
    switch (result.type) {
      case "order":
        return <Package className="h-4 w-4 text-blue-400" />;
      case "trip":
        return <Truck className="h-4 w-4 text-emerald-400" />;
      case "driver":
        return <Users className="h-4 w-4 text-purple-400" />;
      case "insight":
        return <Sparkles className="h-4 w-4 text-amber-400" />;
      default:
        return <ArrowRight className="h-4 w-4 text-zinc-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="flex items-start justify-center pt-[20vh]">
        <div
          ref={containerRef}
          className="w-full max-w-2xl mx-4 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              ) : (
                <Command className="h-4 w-4 text-blue-400" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, trips, drivers or ask FleetAI..."
              className="flex-1 bg-transparent text-white text-lg placeholder:text-zinc-600 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 font-mono text-[10px] font-medium text-zinc-400">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI Interpretation */}
          {aiInterpretation && (
            <div className="px-4 py-3 bg-blue-950/20 border-b border-zinc-800">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-200">{aiInterpretation.interpretation}</p>
                  {aiInterpretation.summary && (
                    <p className="text-xs text-zinc-400 mt-1">{aiInterpretation.summary}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {results.length === 0 && query && !isLoading && (
              <div className="px-4 py-8 text-center">
                <Search className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No results found for "{query}"</p>
                <p className="text-xs text-zinc-600 mt-1">Try a different search term or ask FleetAI a question</p>
              </div>
            )}

            {results.length === 0 && !query && (
              <div className="p-4 space-y-4">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2">
                  Quick Actions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <QuickActionCard
                    icon={<Package className="h-5 w-5 text-blue-400" />}
                    title="New Order"
                    onClick={() => { router.push("/orders/new/enterprise"); onClose(); }}
                  />
                  <QuickActionCard
                    icon={<Users className="h-5 w-5 text-purple-400" />}
                    title="Dispatch Board"
                    onClick={() => { router.push("/dispatch"); onClose(); }}
                  />
                  <QuickActionCard
                    icon={<Truck className="h-5 w-5 text-emerald-400" />}
                    title="Active Trips"
                    onClick={() => { router.push("/trips"); onClose(); }}
                  />
                  <QuickActionCard
                    icon={<MapPin className="h-5 w-5 text-rose-400" />}
                    title="Fleet Map"
                    onClick={() => { router.push("/map"); onClose(); }}
                  />
                </div>

                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 pt-4">
                  AI Commands
                </div>
                <div className="space-y-1">
                  <AICommandHint command="Show me all unassigned orders" />
                  <AICommandHint command="Which trips are running late?" />
                  <AICommandHint command="Calculate cost for Chicago to Toronto" />
                  <AICommandHint command="Find high-margin opportunities" />
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      selectedIndex === index
                        ? "bg-blue-600/20 border border-blue-500/30"
                        : "hover:bg-zinc-900 border border-transparent"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-white/5">
                      {getResultIcon(result)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-zinc-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <ArrowRight className={cn(
                      "h-4 w-4 transition-colors",
                      selectedIndex === index ? "text-blue-400" : "text-zinc-600"
                    )} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">↵</kbd>
                Select
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Sparkles className="h-3 w-3 text-blue-400" />
              Powered by FleetAI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ 
  icon, 
  title, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
        {icon}
      </div>
      <span className="text-sm font-medium text-zinc-200">{title}</span>
    </button>
  );
}

function AICommandHint({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-900/50 cursor-pointer">
      <Search className="h-3.5 w-3.5 text-zinc-600" />
      <span className="text-sm text-zinc-400">"{command}"</span>
    </div>
  );
}

// Hook for keyboard shortcut
export function useCommandBar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
}
