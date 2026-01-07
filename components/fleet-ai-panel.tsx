"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp,
  Truck,
  Package,
  Users,
  DollarSign,
  Clock,
  Loader2,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    type?: "insight" | "recommendation" | "alert" | "action";
    data?: any;
  };
}

interface FleetAIPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  context?: {
    currentPage?: string;
    selectedOrder?: any;
    selectedTrip?: any;
    selectedDriver?: any;
  };
}

export function FleetAIPanel({ isOpen, onToggle, context }: FleetAIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm FleetAI, your intelligent fleet operations assistant. I can help you with:\n\n• **Dispatch optimization** - Find the best driver for any order\n• **Profitability analysis** - Calculate margins and suggest rates\n• **Trip monitoring** - Track ETAs and predict delays\n• **Natural language search** - Ask questions about your fleet\n\nWhat would you like help with?",
          timestamp: new Date(),
          metadata: { type: "insight" }
        }
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Update conversation history
    const newHistory = [...conversationHistory, { role: "user" as const, content: inputValue }];

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputValue,
          conversationHistory: newHistory,
          context
        })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory([...newHistory, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, conversationHistory, context]);

  const handleQuickAction = useCallback((action: string) => {
    setInputValue(action);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const input = inputRef.current;
      if (input) {
        const form = input.closest("form");
        if (form) form.requestSubmit();
      }
    }, 50);
  }, []);

  const renderMessageContent = (message: ChatMessage) => {
    // Handle markdown-style formatting
    const content = message.content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n/g, "<br />");

    return (
      <div 
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  const getMessageIcon = (message: ChatMessage) => {
    if (message.metadata?.type === "recommendation") return <Lightbulb className="h-4 w-4 text-amber-400" />;
    if (message.metadata?.type === "alert") return <AlertTriangle className="h-4 w-4 text-rose-400" />;
    if (message.metadata?.type === "action") return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    return null;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black",
          isOpen 
            ? "bg-zinc-800 text-zinc-400 rotate-90" 
            : "bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
        )}
        aria-label="Toggle FleetAI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed z-40 transform transition-all duration-300 ease-in-out",
          isExpanded 
            ? "bottom-0 right-0 w-[600px] h-screen" 
            : "bottom-44 right-6 w-[420px]",
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <Card className={cn(
          "flex flex-col overflow-hidden border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50",
          isExpanded ? "h-full rounded-none" : "h-[600px] rounded-2xl"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-blue-950/50 to-purple-950/50 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  FleetAI Assistant
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    ONLINE
                  </Badge>
                </h3>
                <p className="text-xs text-zinc-400">
                  {context?.currentPage ? `Viewing: ${context.currentPage}` : "Ready to help"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="subtle"
                size="sm"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 px-4 py-3 border-b border-zinc-800/50 overflow-x-auto scrollbar-none">
            <QuickActionButton icon={Package} label="Unassigned Orders" onClick={() => handleQuickAction("Show me all unassigned orders that need attention")} />
            <QuickActionButton icon={Truck} label="Late Trips" onClick={() => handleQuickAction("Which trips are at risk of being late?")} />
            <QuickActionButton icon={DollarSign} label="Margin Check" onClick={() => handleQuickAction("Which orders have low margins?")} />
            <QuickActionButton icon={Users} label="Driver Status" onClick={() => handleQuickAction("What's the current driver availability?")} />
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/5">
                    <Bot className="h-4 w-4 text-blue-400" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-zinc-900 text-zinc-200 rounded-bl-sm border border-zinc-800"
                  )}
                >
                  {msg.role === "assistant" && getMessageIcon(msg) && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-700/50">
                      {getMessageIcon(msg)}
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {msg.metadata?.type}
                      </span>
                    </div>
                  )}
                  {renderMessageContent(msg)}
                  <span className="mt-2 block text-[10px] opacity-40">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/5">
                  <Bot className="h-4 w-4 text-blue-400" />
                </div>
                <div className="bg-zinc-900 text-zinc-200 rounded-2xl rounded-bl-sm border border-zinc-800 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-sm text-zinc-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Context Banner */}
          {(context?.selectedOrder || context?.selectedTrip) && (
            <div className="px-4 py-2 bg-zinc-900/50 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Clock className="h-3 w-3" />
                <span>
                  Context: {context.selectedOrder ? `Order ${context.selectedOrder.orderNumber}` : ""}
                  {context.selectedTrip ? `Trip ${context.selectedTrip.tripNumber}` : ""}
                </span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-zinc-800 bg-zinc-900/30 p-4 backdrop-blur-sm">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask FleetAI anything..."
                className="w-full rounded-xl border border-zinc-800 bg-black/50 py-3 pl-4 pr-12 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-zinc-600">
              FleetAI can make mistakes. Verify important information.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-colors text-xs text-zinc-400 hover:text-zinc-200 whitespace-nowrap"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
