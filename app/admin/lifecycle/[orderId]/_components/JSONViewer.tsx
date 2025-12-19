"use client";

import React from "react";
import { X, Copy, Check } from "lucide-react";

interface JSONViewerProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title: string;
}

export function JSONViewer({ isOpen, onClose, data, title }: JSONViewerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-950">
          <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
