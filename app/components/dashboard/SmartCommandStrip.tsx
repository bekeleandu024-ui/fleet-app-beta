'use client';

import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, MapPin, Navigation, Search, TrendingUp } from 'lucide-react';
import { darkERPTheme } from '@/app/lib/theme-config';

type ActiveSegment = 'origin' | 'destination' | 'entity' | null;

const LANE_SUGGESTIONS = ['Toronto, ON', 'Chicago, IL', 'Montreal, QC', 'Columbus, OH', 'Detroit, MI'];
const ENTITY_SUGGESTIONS = ['Order ORD-453220', 'Truck #4521', 'Driver: J. Smith', 'Customer: Acme Corp'];

export default function SmartCommandStrip() {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [entityQuery, setEntityQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState<ActiveSegment>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const laneMatches = useMemo(() => {
    if (activeSegment !== 'origin' && activeSegment !== 'destination') {
      return [];
    }
    const needle = (activeSegment === 'origin' ? originQuery : destinationQuery).toLowerCase();
    if (!needle) {
      return LANE_SUGGESTIONS.slice(0, 4);
    }
    return LANE_SUGGESTIONS.filter((option) => option.toLowerCase().includes(needle)).slice(0, 4);
  }, [activeSegment, originQuery, destinationQuery]);

  const entityMatches = useMemo(() => {
    if (activeSegment !== 'entity') {
      return [];
    }
    const needle = entityQuery.toLowerCase();
    if (!needle) {
      return ENTITY_SUGGESTIONS.slice(0, 4);
    }
    return ENTITY_SUGGESTIONS.filter((option) => option.toLowerCase().includes(needle)).slice(0, 4);
  }, [activeSegment, entityQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    // Placeholder: wire up ATLAS + HERE APIs for lane insights and routing.
    setTimeout(() => setIsSubmitting(false), 900);
  };

  return (
    <section
      className="mb-8"
      style={{
        border: `1px solid ${darkERPTheme.border}`,
        backgroundColor: darkERPTheme.surface,
        borderRadius: darkERPTheme.radius.lg,
        padding: '24px',
      }}
    >
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Instant Summaries (ATLAS API) */}
        <div className="flex flex-col gap-3 xl:w-72">
          <SummaryCard
            title="Internal Intel"
            subtitle="Powered by ATLAS lane memory"
          >
            <SummaryRow label="Similar trips this week" value="4 • Avg on-time 92%" />
            <SummaryRow label="Margin per trip" value="$520" />
            <SummaryRow label="Cost band" value="$2.1k – $2.6k" />
          </SummaryCard>

          <SummaryCard title="Market Snapshot" subtitle="Live market + HERE traffic">
            <SummaryRow
              label="Drive time"
              value="8h 45m"
              valueColor={darkERPTheme.textPrimary}
            />
            <SummaryRow
              label="Traffic advisory"
              value="Watch: I-94 slowdowns"
              valueColor={darkERPTheme.severity.watch}
            />
            <SummaryRow
              label="Spot rate band"
              value="$2.38 – $2.71 / mile"
              valueColor={darkERPTheme.severity.risk}
            />
          </SummaryCard>

          <SummaryCard title="Next Best Actions" subtitle="Based on current lane demand">
            <div className="flex flex-col gap-2">
              {['Create Quote', 'Book Trip', 'Open Lane Report'].map((cta) => (
                <button
                  key={cta}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded"
                  style={{
                    backgroundColor: darkERPTheme.surface,
                    border: `1px solid ${darkERPTheme.border}`,
                    color: darkERPTheme.brandAccent,
                  }}
                  type="button"
                >
                  <span>{cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </SummaryCard>
        </div>

        {/* Live Map (HERE API placeholder) */}
        <div
          className="flex-1 min-h-[224px] relative overflow-hidden"
          style={{
            backgroundColor: darkERPTheme.surface2,
            border: `1px solid ${darkERPTheme.border}`,
            borderRadius: darkERPTheme.radius.md,
          }}
        >
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(58,123,219,0.3), transparent)' }} />
          <div className="absolute inset-0 flex flex-col justify-center items-center gap-3 text-center px-8">
            <MapPin className="h-10 w-10" style={{ color: darkERPTheme.brandAccent }} />
            <p className="text-sm" style={{ color: darkERPTheme.textMuted }}>
              HERE Maps placeholder. Render real-time corridor highlights, ETA, and active trips once the query is submitted.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: darkERPTheme.textMuted }}>
              <Navigation className="h-4 w-4" />
              <span>Accepts bounding boxes + markers from the Smart Command Strip payload.</span>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="xl:w-[360px]">
          <form
            onSubmit={handleSubmit}
            className="h-full flex flex-col gap-4"
            aria-label="Smart command quick search"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: darkERPTheme.textPrimary }}>
                Quick Search
              </span>
              <span className="text-xs" style={{ color: darkERPTheme.textMuted }}>
                Order #, Truck, Driver, Customer
              </span>
            </div>

            <div
              className="flex gap-2"
              style={{
                backgroundColor: darkERPTheme.surface2,
                border: `1px solid ${darkERPTheme.border}`,
                borderRadius: darkERPTheme.radius.md,
                padding: '16px',
              }}
            >
              <SegmentInput
                id="origin"
                label="Origin"
                placeholder="City, State"
                value={originQuery}
                onFocus={() => setActiveSegment('origin')}
                onChange={setOriginQuery}
              />
              <SegmentInput
                id="destination"
                label="Destination"
                placeholder="City, State"
                value={destinationQuery}
                onFocus={() => setActiveSegment('destination')}
                onChange={setDestinationQuery}
              />
              <SegmentInput
                id="entity"
                label="Entity"
                placeholder="Order, truck, driver"
                value={entityQuery}
                onFocus={() => setActiveSegment('entity')}
                onChange={setEntityQuery}
                adornment={<Search className="h-3.5 w-3.5" style={{ color: darkERPTheme.textMuted }} />}
              />
            </div>

            {(laneMatches.length > 0 || entityMatches.length > 0) && (
              <div
                className="grid gap-2"
                style={{ color: darkERPTheme.textMuted }}
              >
                {[...laneMatches, ...entityMatches].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      if (activeSegment === 'origin') {
                        setOriginQuery(suggestion);
                      } else if (activeSegment === 'destination') {
                        setDestinationQuery(suggestion);
                      } else {
                        setEntityQuery(suggestion);
                      }
                    }}
                    className="flex items-center justify-between px-4 py-2 text-sm rounded"
                    style={{
                      backgroundColor: darkERPTheme.surface,
                      border: `1px solid ${darkERPTheme.border}`,
                      color: darkERPTheme.textPrimary,
                    }}
                  >
                    <span>{suggestion}</span>
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: darkERPTheme.brandAccent }} />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs" style={{ color: darkERPTheme.textMuted }}>
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Submitting dispatches map + atlas payloads for contextual insights.</span>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded"
                style={{
                  backgroundColor: darkERPTheme.brandAccent,
                  color: '#0F1422',
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing…' : 'Run Command'}
                <TrendingUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

interface SummaryCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

function SummaryCard({ title, subtitle, children }: SummaryCardProps) {
  return (
    <div
      style={{
        backgroundColor: darkERPTheme.surface2,
        border: `1px solid ${darkERPTheme.border}`,
        borderRadius: darkERPTheme.radius.md,
        padding: '16px',
      }}
    >
      <div className="flex flex-col gap-1 mb-3">
        <span className="text-sm font-semibold" style={{ color: darkERPTheme.textPrimary }}>
          {title}
        </span>
        <span className="text-xs" style={{ color: darkERPTheme.textMuted }}>
          {subtitle}
        </span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function SummaryRow({ label, value, valueColor = darkERPTheme.textPrimary }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: darkERPTheme.textMuted }}>{label}</span>
      <span style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

interface SegmentInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onFocus: () => void;
  onChange: (value: string) => void;
  adornment?: React.ReactNode;
}

function SegmentInput({ id, label, placeholder, value, onFocus, onChange, adornment }: SegmentInputProps) {
  return (
    <label htmlFor={id} className="flex-1 flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: darkERPTheme.textMuted }}>
        {label}
      </span>
      <div className="relative">
        {adornment && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {adornment}
          </span>
        )}
        <input
          id={id}
          name={id}
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full text-sm"
          style={{
            backgroundColor: darkERPTheme.surface,
            border: `1px solid ${darkERPTheme.border}`,
            borderRadius: darkERPTheme.radius.md,
            color: darkERPTheme.textPrimary,
            padding: adornment ? '10px 12px 10px 32px' : '10px 12px',
          }}
        />
      </div>
    </label>
  );
}
