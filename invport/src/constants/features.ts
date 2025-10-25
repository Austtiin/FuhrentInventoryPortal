export interface FeatureCategoryConfig {
  name: string;
  keywords: string[]; // lowercased keywords to match in feature name
}

// Default category keyword map. You can edit keywords to refine grouping.
export const FEATURE_CATEGORIES: FeatureCategoryConfig[] = [
  { name: 'Flooring', keywords: ['floor', 'flooring', 'vinyl', 'carpet', 'laminate'] },
  { name: 'Package', keywords: ['package', 'pkg', 'bundle', 'kit'] },
  { name: 'Frame', keywords: ['frame', 'gs frame', 'steel', 'aluminum'] },
  { name: 'Interior options', keywords: ['interior', 'seat', 'heater', 'furnace', 'ac', 'a/c', 'cab', 'radio', 'stereo', 'usb', '12v', 'lighting'] },
  { name: 'Exterior options', keywords: ['exterior', 'awning', 'roof', 'door', 'window', 'bumper', 'ladder', 'hitch', 'rack', 'tire', 'wheel'] },
];

export function detectFeatureCategory(name: string, categories: FeatureCategoryConfig[]): string {
  const n = (name || '').toLowerCase();
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (kw && n.includes(kw)) return cat.name;
    }
  }
  return 'Other';
}
