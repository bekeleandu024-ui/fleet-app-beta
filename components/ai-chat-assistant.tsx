"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingInsights } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string | React.ReactNode;
  timestamp: Date;
}

interface AIChatAssistantProps {
  insights: BookingInsights | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function AIChatAssistant({ insights, isOpen, onToggle }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Initialize chat with insights when they become available
  useEffect(() => {
    if (insights && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      const initialMessages: ChatMessage[] = [];
      
      // Message 1: Key Insights
      if (insights.operationalInsights && insights.operationalInsights.length > 0) {
        initialMessages.push({
          id: "init-insights",
          role: "assistant",
          content: (
            <div className="space-y-2">
              <p className="font-medium mb-2">Here are the Key Insights for this trip:</p>
              <ul className="space-y-2">
                {insights.operationalInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ),
          timestamp: new Date()
        });
      }
      
      // Message 2: Risk Factors
      if (insights.riskFactors && insights.riskFactors.length > 0) {
        initialMessages.push({
          id: "init-risks",
          role: "assistant",
          content: (
            <div className="space-y-2">
              <p className="font-medium mb-2">I've also identified the following Risk Factors:</p>
              <ul className="space-y-2">
                {insights.riskFactors.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ),
          timestamp: new Date(Date.now() + 500) // Slight delay for effect
        });
      } else {
         // If no risks, maybe a positive message?
         initialMessages.push({
            id: "init-no-risks",
            role: "assistant",
            content: "No significant risk factors identified for this trip.",
            timestamp: new Date(Date.now() + 500)
         });
      }

      setMessages(initialMessages);
    }
  }, [insights]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    // Simulate AI response (mock for now)
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm analyzing that request. (This is a demo response - real AI integration would go here).",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={onToggle}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${
          isOpen ? "bg-zinc-800 text-zinc-400 rotate-90" : "bg-purple-600 text-white hover:bg-purple-500"
        }`}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-96 transform transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <Card className="flex h-[500px] flex-col overflow-hidden border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                <Bot className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Fleet AI Assistant</h3>
                <p className="text-xs text-zinc-400">Online • Analyzing Trip</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                <Bot className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">Waiting for trip analysis...</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800"
                  }`}
                >
                  {typeof msg.content === 'string' ? <p>{msg.content}</p> : msg.content}
                  <span className="mt-1 block text-[10px] opacity-50">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-800 bg-zinc-900/30 p-4 backdrop-blur-sm">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about this trip..."
                className="w-full rounded-full border border-zinc-800 bg-black/50 py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
