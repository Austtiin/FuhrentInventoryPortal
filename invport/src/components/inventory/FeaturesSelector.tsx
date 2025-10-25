'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { FEATURE_CATEGORIES, FeatureCategoryConfig, detectFeatureCategory } from '@/constants/features';

export interface FeatureOption {
  FeatureID: number;
  FeatureName: string;
}

interface FeaturesSelectorProps {
  selected: number[];
  onChange: (next: number[]) => void;
  title?: string;
  lazy?: boolean; // if true, don't fetch until expanded/visible
  className?: string;
  defaultOpen?: boolean;
  categoryConfig?: FeatureCategoryConfig[];
  small?: boolean;
}

export default function FeaturesSelector({ selected, onChange, title = 'Features', lazy = true, className = '', defaultOpen, categoryConfig, small = true }: FeaturesSelectorProps) {
  const [isOpen, setIsOpen] = useState(!!defaultOpen);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const categories = categoryConfig ?? FEATURE_CATEGORIES;

  const loadFeatures = useCallback(async () => {
    if (hasLoaded) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/features');
      const text = await res.text();
      let list: FeatureOption[] = [];
      try {
        const parsed = JSON.parse(text) as unknown;
        if (Array.isArray(parsed)) {
          list = (parsed as Array<Record<string, unknown>>)
            .map((f) => ({
              FeatureID: Number((f['FeatureID'] ?? f['featureId'] ?? f['id']) as number | string | undefined) || 0,
              FeatureName: String((f['FeatureName'] ?? f['featureName'] ?? f['name']) as string | undefined || ''),
            }))
            .filter((f) => f.FeatureID && f.FeatureName);
        }
      } catch (e) {
        console.warn('Features parse failed:', e, text?.slice(0, 200));
      }
      setFeatures(list);
      setHasLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load features');
    } finally {
      setIsLoading(false);
    }
  }, [hasLoaded]);

  // Optional: auto-load when first expanded
  useEffect(() => {
    if (!lazy) return;
    if (isOpen && !hasLoaded) loadFeatures();
  }, [isOpen, hasLoaded, lazy, loadFeatures]);

  // Optional: intersection observer to lazy fetch when visible
  useEffect(() => {
    if (!lazy || hasLoaded) return;
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasLoaded) {
          loadFeatures();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazy, hasLoaded, loadFeatures]);

  const toggle = (id: number) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  };

  const grouped = useMemo(() => {
    const by: Record<string, FeatureOption[]> = {};
    for (const f of features) {
      const cat = detectFeatureCategory(f.FeatureName, categories);
      if (!by[cat]) by[cat] = [];
      by[cat].push(f);
    }
    // Ensure stable category order: config order, then 'Other'
    const order = [...categories.map(c => c.name), 'Other'];
    return { by, order } as const;
  }, [features, categories]);

  return (
    <div ref={containerRef} className={className}>
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {lazy && !hasLoaded && (
            <button
              type="button"
              onClick={loadFeatures}
              className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Load features
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isOpen ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {isOpen && (
        <div className="mt-3">
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading features…</div>
          ) : (
            <div className="space-y-4">
              {grouped.order.map((cat) => (
                <div key={cat}>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">{cat}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(grouped.by[cat] || []).map((f) => {
                      const active = selected.includes(f.FeatureID);
                      return (
                        <div
                          key={f.FeatureID}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggle(f.FeatureID)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggle(f.FeatureID);
                            }
                          }}
                          aria-pressed={active}
                          className={`cursor-pointer flex items-center justify-between gap-2 ${small ? 'p-2' : 'p-3'} rounded-md border transition-colors ${
                            active ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'
                          }`}
                        >
                          <span className={`truncate ${small ? 'text-xs' : 'text-sm'} font-medium text-gray-900`} title={f.FeatureName}>
                            {f.FeatureName}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggle(f.FeatureID); }}
                            aria-pressed={active}
                            className={`relative inline-flex ${small ? 'h-5 w-9' : 'h-6 w-11'} items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              active ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block ${small ? 'h-4 w-4' : 'h-5 w-5'} transform rounded-full bg-white shadow transition-transform duration-200 ${
                                active ? (small ? 'translate-x-4' : 'translate-x-5') : (small ? 'translate-x-1' : 'translate-x-1')
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                    {(!grouped.by[cat] || grouped.by[cat].length === 0) && (
                      <div className="col-span-full text-xs text-gray-500">No items</div>
                    )}
                  </div>
                </div>
              ))}
              {features.length === 0 && !isLoading && (
                <div className="text-sm text-gray-600">No features returned.</div>
              )}
            </div>
          )}
          {hasLoaded && (
            <p className="mt-3 text-xs text-gray-500">Tip: Use the switches to enable or disable each feature.</p>
          )}
        </div>
      )}
    </div>
  );
}
