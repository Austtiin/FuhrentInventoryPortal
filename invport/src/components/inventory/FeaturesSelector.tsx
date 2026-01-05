'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { FEATURE_CATEGORIES, UNSORTED_FEATURE_CATEGORY, detectFeatureCategory, FeatureCategoryConfig } from '@/constants/features';

export interface FeatureOption {
  FeatureID: number;
  FeatureName: string;
}

interface FeaturesSelectorProps {
  selected: number[];
  onChange: (next: number[]) => void;
  title?: string;
  lazy?: boolean;
  className?: string;
  defaultOpen?: boolean;
  small?: boolean;
  categoryConfig?: FeatureCategoryConfig[];
}

export default function FeaturesSelector({ selected, onChange, title = 'Unit Features', lazy = false, className = '', defaultOpen = true, small = false, categoryConfig }: FeaturesSelectorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const categories = categoryConfig ?? FEATURE_CATEGORIES;

  const loadFeatures = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch('/features', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load features (${res.status})`);
      const data = await res.json();
      const list: FeatureOption[] = Array.isArray(data?.features) ? data.features : Array.isArray(data) ? data : [];
      setFeatures(list);
      setHasLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load features');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lazy) return;
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

  useEffect(() => {
    if (!lazy && !hasLoaded) {
      loadFeatures();
    }
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
    const order = [...categories.map((c) => c.name), UNSORTED_FEATURE_CATEGORY];
    return { by, order } as const;
  }, [features, categories]);

  return (
    <div ref={containerRef} className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
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
                <div key={cat} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {cat}
                      </span>
                      <span className="text-[11px] text-gray-500">{(grouped.by[cat] || []).length} features</span>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="my-2 h-px bg-gray-100" />
                    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${small ? 'gap-1' : 'gap-2'}`}>
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
                              active ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-gray-300'
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
