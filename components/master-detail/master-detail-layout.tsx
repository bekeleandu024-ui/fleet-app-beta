"use client";

import { ReactNode, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MasterDetailLayoutProps {
  /** Master list (left pane) - 30% width */
  masterList: ReactNode;
  /** Detail panel (right pane) - 70% width */
  detailPanel: ReactNode;
  /** Optional header for the entire layout */
  header?: ReactNode;
  /** Whether the detail panel is empty/no selection */
  isEmpty?: boolean;
  /** Empty state content when nothing is selected */
  emptyState?: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Full-Width Split-Pane Layout (Master-Detail)
 * 
 * Left Pane (30%): Scrollable master list
 * Right Pane (70%): Fluid detail panel
 */
export function MasterDetailLayout({
  masterList,
  detailPanel,
  header,
  isEmpty = false,
  emptyState,
  className,
}: MasterDetailLayoutProps) {
  return (
    <div className={cn("flex flex-col h-full bg-black", className)}>
      {/* Optional Global Header */}
      {header && (
        <div className="flex-none border-b border-zinc-800">
          {header}
        </div>
      )}

      {/* Split Pane Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Master List (Left Pane - 35%) */}
        <div className="w-[35%] min-w-[360px] flex flex-col border-r border-zinc-800 bg-black overflow-hidden">
          {masterList}
        </div>

        {/* Detail Panel (Right Pane - 65%) */}
        <div className="w-[65%] flex flex-col bg-black overflow-hidden">
          {isEmpty && emptyState ? emptyState : detailPanel}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty State Component for when no record is selected
 */
export function MasterDetailEmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="h-full flex items-center justify-center bg-[#111114]/50">
      <div className="text-center max-w-md px-6">
        {icon && (
          <div className="mx-auto mb-4 text-[#5a5a6e]">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-[#a0a0b0] mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-[#5a5a6e]">{description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Master List Header with search and filters
 */
interface MasterListHeaderProps {
  title: string;
  count?: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  children?: ReactNode; // Quick filter buttons
}

export function MasterListHeader({
  title,
  count,
  searchValue,
  onSearchChange,
  children,
}: MasterListHeaderProps) {
  return (
    <div className="flex-none border-b border-[#1c1c22] bg-[#111114]">
      {/* Title Row */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#e8e8ed]">{title}</h2>
          {count !== undefined && (
            <span className="text-xs text-[#5a5a6e] tabular-nums">({count})</span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a5a6e]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#1c1c22] border border-[#2a2a32] rounded-md text-[#e8e8ed] placeholder-[#5a5a6e] focus:outline-none focus:ring-1 focus:ring-[#5a6a8a]/50 focus:border-[#5a6a8a]/50"
          />
        </div>
      </div>

      {/* Quick Filters */}
      {children && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Quick Filter Button for Master List
 */
interface QuickFilterProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  variant?: "default" | "danger" | "warning" | "success";
}

export function QuickFilter({
  label,
  count,
  isActive,
  onClick,
  variant = "default",
}: QuickFilterProps) {
  const variantStyles = {
    default: isActive
      ? "bg-[#5a6a8a]/20 text-[#8a9aba] border-[#5a6a8a]/40"
      : "bg-[#1c1c22] text-[#a0a0b0] border-[#2a2a32] hover:border-[#3a3a42]",
    danger: isActive
      ? "bg-[#b45353]/20 text-[#d47373] border-[#b45353]/40"
      : "bg-[#1c1c22] text-[#a0a0b0] border-[#2a2a32] hover:border-[#3a3a42]",
    warning: isActive
      ? "bg-[#c97a5a]/20 text-[#e9a07a] border-[#c97a5a]/40"
      : "bg-[#1c1c22] text-[#a0a0b0] border-[#2a2a32] hover:border-[#3a3a42]",
    success: isActive
      ? "bg-[#5a7a6b]/20 text-[#7a9a8b] border-[#5a7a6b]/40"
      : "bg-[#1c1c22] text-[#a0a0b0] border-[#2a2a32] hover:border-[#3a3a42]",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 text-xs font-medium rounded border transition-colors",
        variantStyles[variant]
      )}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1 tabular-nums opacity-70">({count})</span>
      )}
    </button>
  );
}

/**
 * Master List Card - Condensed row item
 */
interface MasterListCardProps {
  id: string;
  isSelected: boolean;
  onClick: () => void;
  statusColor: string; // Tailwind color class (e.g., "bg-amber-500")
  children: ReactNode;
  className?: string;
}

export function MasterListCard({
  id,
  isSelected,
  onClick,
  statusColor,
  children,
  className,
}: MasterListCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative px-3 py-2.5 cursor-pointer border-b border-[#1c1c22] transition-colors",
        isSelected
          ? "bg-[#1c1c22] border-l-2 border-l-[#3a3a42]"
          : "bg-transparent hover:bg-[#1c1c22]/50 border-l-2 border-l-transparent",
        className
      )}
    >
      {/* Status Indicator Bar */}
      <div
        className={cn(
          "absolute top-2 bottom-2 right-0 w-0.5 rounded-l",
          statusColor
        )}
      />

      {children}
    </div>
  );
}

/**
 * Detail Panel Header - Sticky with actions and progress stepper
 */
interface DetailPanelHeaderProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  actions?: ReactNode;
  progressStepper?: ReactNode;
}

export function DetailPanelHeader({
  title,
  subtitle,
  status,
  statusColor = "bg-zinc-600",
  actions,
  progressStepper,
}: DetailPanelHeaderProps) {
  return (
    <div className="flex-none sticky top-0 z-10 bg-black border-b border-zinc-800">
      {/* Main Header Row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">{title}</h1>
            {subtitle && (
              <p className="text-xs text-zinc-500">{subtitle}</p>
            )}
          </div>
          {status && (
            <span className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md",
              statusColor
            )}>
              {status}
            </span>
          )}
        </div>

        {/* Global Actions */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Progress Stepper */}
      {progressStepper && (
        <div className="px-4 pb-3">
          {progressStepper}
        </div>
      )}
    </div>
  );
}

/**
 * Progress Stepper Component
 */
interface ProgressStep {
  label: string;
  status: "completed" | "current" | "upcoming";
}

interface ProgressStepperProps {
  steps: ProgressStep[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          {/* Step - Enterprise neutral: gray base, only active emphasized */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
            step.status === "completed" && "text-[#5a5a6e]",
            step.status === "current" && "text-[#e8e8ed] font-medium bg-[#1c1c22] border-b-2 border-[#5a6a8a]",
            step.status === "upcoming" && "text-[#5a5a6e]"
          )}>
            {step.status === "completed" && (
              <svg className="w-3 h-3 text-[#5a5a6e]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {step.label}
          </div>

          {/* Connector */}
          {index < steps.length - 1 && (
            <svg className="w-4 h-4 text-[#3a3a42] mx-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Three-Column Grid for Detail Panel Content
 */
interface DetailGridProps {
  children: ReactNode;
  className?: string;
}

export function DetailGrid({ children, className }: DetailGridProps) {
  return (
    <div className={cn(
      "flex-1 overflow-y-auto p-4",
      className
    )}>
      <div className="grid grid-cols-12 gap-4 items-stretch">
        {children}
      </div>
    </div>
  );
}

/**
 * Grid Column Wrapper
 */
interface GridColumnProps {
  /** Column span: execution (5), specifics (4), administrative (3) */
  span: 3 | 4 | 5;
  children: ReactNode;
  className?: string;
}

export function GridColumn({ span, children, className }: GridColumnProps) {
  const spanClass = {
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
  };

  return (
    <div className={cn(spanClass[span], "flex flex-col", className)}>
      {children}
    </div>
  );
}

/**
 * Section Card for Detail Panel
 */
interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function SectionCard({
  title,
  icon,
  children,
  actions,
  className,
  compact = true,
}: SectionCardProps) {
  return (
    <div className={cn(
      "rounded-lg border border-zinc-800 bg-zinc-900/50",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-zinc-800",
        compact ? "px-3 py-2" : "px-4 py-3"
      )}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-zinc-500">{icon}</span>}
          <span className={cn(
            "font-medium text-zinc-300",
            compact ? "text-xs" : "text-sm"
          )}>
            {title}
          </span>
        </div>
        {actions}
      </div>

      {/* Content */}
      <div className={compact ? "p-3" : "p-4"}>
        {children}
      </div>
    </div>
  );
}

/**
 * Data Row for compact key-value display
 */
interface DataRowProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

export function DataRow({ label, value, valueClassName }: DataRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={cn("text-xs text-zinc-200 font-medium", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
