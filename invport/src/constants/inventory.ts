/**
 * Inventory Management Constants
 * 
 * Centralized constants for inventory status, conditions, and item types.
 * These replace the old mockData.ts file for better organization.
 */

export const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'sold', label: 'Sold', color: 'blue' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
] as const;

export const CONDITION_OPTIONS = ['New', 'Pre-Owned', 'Certified'] as const;

export const ITEM_TYPES = [
  { value: 'FishHouse', label: 'Fish House', typeId: 1 },
  { value: 'Vehicle', label: 'Vehicle', typeId: 2 },
  { value: 'Trailer', label: 'Trailer', typeId: 3 },
] as const;

export const VEHICLE_COLORS = [
  'Black',
  'White',
  'Silver',
  'Gray',
  'Red',
  'Blue',
  'Green',
  'Brown',
  'Beige',
  'Tan',
  'Gold',
  'Orange',
  'Yellow',
  'Purple',
  'Maroon',
  'Brandywine',
  'Navy',
  'Teal',
  'Other'
] as const;

// Type exports for TypeScript
export type StatusValue = typeof STATUS_OPTIONS[number]['value'];
export type ConditionValue = typeof CONDITION_OPTIONS[number];
export type ItemTypeValue = typeof ITEM_TYPES[number]['value'];
export type VehicleColorValue = typeof VEHICLE_COLORS[number];
