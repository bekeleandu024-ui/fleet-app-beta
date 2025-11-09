'use client';

import { useState } from 'react';
import { Search, MapPin, TrendingUp, Clock, DollarSign, Truck } from 'lucide-react';
import { darkERPTheme, sp } from '@/app/lib/theme-config';

type SearchMode = 'origin' | 'destination' | 'general';

export default function SmartCommandStrip() {
  const [searchMode, setSearchMode] = useState<SearchMode>('general');
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [generalQuery, setGeneralQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sample suggestions for origin/destination
  const citySuggestions = [
    'Chicago, IL', 'Dallas, TX', 'Los Angeles, CA', 'Atlanta, GA', 'Memphis, TN'
  ];

  // Sample general search suggestions
  const generalSuggestions = [
    'ORD-123456', 'Truck #4521', 'Driver: J. Smith', 'Walmart Inc.'
  ];

  return (
    <div
      className="mb-6 rounded-lg p-6 flex gap-6"
      style={{
        backgroundColor: darkERPTheme.surface,
        border: `1px solid ${darkERPTheme.border}`,
      }}
    >
      {/* Left: Quick Search */}
      <div className="flex-shrink-0 w-80">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchMode('general')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}
            style={{
              backgroundColor: searchMode === 'general' ? darkERPTheme.brandAccent : darkERPTheme.surface2,
              color: searchMode === 'general' ? '#FFFFFF' : darkERPTheme.textMuted,
            }}
          >
            General
          </button>
          <button
            onClick={() => setSearchMode('origin')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}
            style={{
              backgroundColor: searchMode === 'origin' ? darkERPTheme.brandAccent : darkERPTheme.surface2,
              color: searchMode === 'origin' ? '#FFFFFF' : darkERPTheme.textMuted,
            }}
          >
            Origin
          </button>
          <button
            onClick={() => setSearchMode('destination')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}
            style={{
              backgroundColor: searchMode === 'destination' ? darkERPTheme.brandAccent : darkERPTheme.surface2,
              color: searchMode === 'destination' ? '#FFFFFF' : darkERPTheme.textMuted,
            }}
          >
            Destination
          </button>
        </div>

        {searchMode === 'general' ? (
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={18}
              style={{ color: darkERPTheme.textMuted }}
            />
            <input
              type="text"
              placeholder="Order #, Truck #, Driver, Customer..."
              value={generalQuery}
              onChange={(e) => {
                setGeneralQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: darkERPTheme.surface2,
                border: `1px solid ${darkERPTheme.border}`,
                color: darkERPTheme.textPrimary,
              }}
            />
            {showSuggestions && generalQuery.length > 0 && (
              <div
                className="absolute top-full mt-2 w-full rounded-lg p-2 z-10"
                style={{
                  backgroundColor: darkERPTheme.surface2,
                  border: `1px solid ${darkERPTheme.border}`,
                }}
              >
                {generalSuggestions
                  .filter((s) => s.toLowerCase().includes(generalQuery.toLowerCase()))
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setGeneralQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                      style={{
                        color: darkERPTheme.textPrimary,
                        backgroundColor: darkERPTheme.surface,
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2"
                size={18}
                style={{ color: darkERPTheme.severity.good }}
              />
              <input
                type="text"
                placeholder="Origin City, State"
                value={originQuery}
                onChange={(e) => setOriginQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: darkERPTheme.surface2,
                  border: `1px solid ${darkERPTheme.border}`,
                  color: darkERPTheme.textPrimary,
                }}
              />
            </div>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2"
                size={18}
                style={{ color: darkERPTheme.severity.breach }}
              />
              <input
                type="text"
                placeholder="Destination City, State"
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: darkERPTheme.surface2,
                  border: `1px solid ${darkERPTheme.border}`,
                  color: darkERPTheme.textPrimary,
                }}
              />
            </div>
            {(originQuery || destinationQuery) && (
              <div
                className="rounded-lg p-2"
                style={{
                  backgroundColor: darkERPTheme.surface2,
                  border: `1px solid ${darkERPTheme.border}`,
                }}
              >
                {citySuggestions.slice(0, 3).map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (searchMode === 'origin') setOriginQuery(city);
                      else setDestinationQuery(city);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-sm hover:opacity-80 transition-opacity"
                    style={{ color: darkERPTheme.textPrimary }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: Live Map */}
      <div
        className="flex-1 rounded-lg overflow-hidden flex items-center justify-center"
        style={{
          backgroundColor: darkERPTheme.surface2,
          border: `1px solid ${darkERPTheme.border}`,
          minHeight: '240px',
        }}
      >
        <div className="text-center">
          <MapPin size={48} style={{ color: darkERPTheme.textMuted }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: darkERPTheme.textMuted }}>
            Live Map with O/D plotting, traffic, and active trips
          </p>
          <p className="text-xs mt-2" style={{ color: darkERPTheme.textMuted }}>
            (Integrate map provider: Mapbox, Google Maps, etc.)
          </p>
        </div>
      </div>

      {/* Right: Instant Summaries */}
      <div className="flex-shrink-0 w-72 space-y-3">
        {/* Internal Intel Card */}
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: darkERPTheme.surface2,
            border: `1px solid ${darkERPTheme.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium" style={{ color: darkERPTheme.textPrimary }}>
              Internal Intel
            </h4>
            <Truck size={16} style={{ color: darkERPTheme.brandAccent }} />
          </div>
          <div className="space-y-2 text-xs" style={{ color: darkERPTheme.textMuted }}>
            <div className="flex justify-between">
              <span>Active Trips on Lane:</span>
              <span style={{ color: darkERPTheme.textPrimary }}>12</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Transit Time:</span>
              <span style={{ color: darkERPTheme.textPrimary }}>14.2 hrs</span>
            </div>
            <div className="flex justify-between">
              <span>Last Week Avg Cost:</span>
              <span style={{ color: darkERPTheme.textPrimary }}>$2,340</span>
            </div>
          </div>
        </div>

        {/* Market Snapshot Card */}
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: darkERPTheme.surface2,
            border: `1px solid ${darkERPTheme.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium" style={{ color: darkERPTheme.textPrimary }}>
              Market Snapshot
            </h4>
            <TrendingUp size={16} style={{ color: darkERPTheme.severity.watch }} />
          </div>
          <div className="space-y-2 text-xs" style={{ color: darkERPTheme.textMuted }}>
            <div className="flex justify-between">
              <span>Spot Rate Index:</span>
              <span style={{ color: darkERPTheme.severity.watch }}>+8% ↑</span>
            </div>
            <div className="flex justify-between">
              <span>Capacity Tightness:</span>
              <span style={{ color: darkERPTheme.severity.risk }}>Medium</span>
            </div>
            <div className="flex justify-between">
              <span>Weather Impact:</span>
              <span style={{ color: darkERPTheme.severity.good }}>Low</span>
            </div>
          </div>
        </div>

        {/* Next Best Actions Card */}
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: darkERPTheme.surface2,
            border: `1px solid ${darkERPTheme.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium" style={{ color: darkERPTheme.textPrimary }}>
              Next Best Actions
            </h4>
            <DollarSign size={16} style={{ color: darkERPTheme.severity.good }} />
          </div>
          <div className="space-y-2 text-xs" style={{ color: darkERPTheme.textMuted }}>
            <div className="flex items-start gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5"
                style={{ backgroundColor: darkERPTheme.brandAccent }}
              />
              <span>Book 2 more trucks on this lane for better backhaul</span>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5"
                style={{ backgroundColor: darkERPTheme.brandAccent }}
              />
              <span>Consider intermodal for cost savings (Est. -12%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
