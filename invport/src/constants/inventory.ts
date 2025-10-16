/**
 * Inventory Management Constants
 * 
 * Centralized constants for inventory status, conditions, and item types.
 * These replace the old mockData.ts file for better organization.
 */

export const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available', color: 'green' },
  { value: 'Sold', label: 'Sold', color: 'blue' },
  { value: 'Pending', label: 'Pending', color: 'yellow' },
] as const;

export const CONDITION_OPTIONS = ['New', 'Used', 'Certified'] as const;

export const ITEM_TYPES = [
  { value: 'FishHouse', label: 'Fish House', typeId: 1 },
  { value: 'Vehicle', label: 'Vehicle', typeId: 2 },
  { value: 'Trailer', label: 'Trailer', typeId: 3 },
] as const;

// Type exports for TypeScript
export type StatusValue = typeof STATUS_OPTIONS[number]['value'];
export type ConditionValue = typeof CONDITION_OPTIONS[number];
export type ItemTypeValue = typeof ITEM_TYPES[number]['value'];
