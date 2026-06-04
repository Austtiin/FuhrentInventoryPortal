/**
 * Shared inventory form logic
 *
 * Centralizes the text formatting, dimension validation, and option lists that
 * were previously duplicated between the Add and Edit inventory pages.
 */

export type ItemType = 'FishHouse' | 'Vehicle' | 'Trailer';

// ---------------------------------------------------------------------------
// Text formatting helpers
// ---------------------------------------------------------------------------

/** Capitalize the first letter of each word. */
export const toTitleCase = (str: string): string =>
  str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Capitalize only the first character; leave the rest as the user typed it. */
export const capitalizeFirst = (str: string): string =>
  !str ? str : str.charAt(0).toUpperCase() + str.slice(1);

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

export const BASE_CATEGORY_OPTIONS = [
  'RV',
  'No Water',
  'Toy Hauler',
  'Snowmobile Trailer',
  'Skid House',
] as const;

export const VEHICLE_CATEGORY_OPTIONS = [
  'Car',
  'Truck',
  'SUV',
  'Sedan',
  'Coupe',
  'Van',
  'Hatchback',
  'Convertible',
  'Box Truck',
  'Pickup Truck',
  'Wagon',
  'Crossover',
] as const;

export const MAKE_SUGGESTIONS = [
  'Ice Castle Fish House',
  'Aluma-Lite',
  'Toyota',
  'BMW',
  'Chevy',
  'Ford',
  'Honda',
] as const;

/** Category options appropriate for the given item type. */
export const getCategoryOptions = (itemType: ItemType): readonly string[] =>
  itemType === 'Vehicle' ? VEHICLE_CATEGORY_OPTIONS : BASE_CATEGORY_OPTIONS;

// ---------------------------------------------------------------------------
// Dimension validation
// ---------------------------------------------------------------------------

/** Validate width/length combinations against make-specific rules. */
export const validateDimensions = (
  make: string,
  length: string,
  width: string
): { valid: boolean; error?: string } => {
  const normalizedMake = make.trim().toLowerCase();

  // Ice Castle Fish House validation
  if (normalizedMake === 'ice castle fish house') {
    if (length && length.trim() && !/^\d+[VS]$/i.test(length.trim())) {
      return {
        valid: false,
        error:
          'For Ice Castle Fish House, length must be a whole number followed by V or S (e.g., 21V or 17S)',
      };
    }
    if (width && width.trim() && !['8', '6.5'].includes(width.trim())) {
      return { valid: false, error: 'For Ice Castle Fish House, width must be either 8 or 6.5' };
    }
  }

  // Aluma-Lite validation
  if (normalizedMake === 'aluma-lite') {
    if (length && length.trim() && !/^\d+[VS]$/i.test(length.trim())) {
      return {
        valid: false,
        error: 'For Aluma-Lite, length must be a whole number followed by V or S (e.g., 21V or 17S)',
      };
    }
    if (width && width.trim() && !['8', '6.5', '6'].includes(width.trim())) {
      return { valid: false, error: 'For Aluma-Lite, width must be 8, 6.5, or 6' };
    }
  }

  // All other makes: whole-number length, numeric width
  if (normalizedMake && normalizedMake !== 'ice castle fish house' && normalizedMake !== 'aluma-lite') {
    if (length && length.trim() && !/^\d+$/.test(length.trim())) {
      return { valid: false, error: 'Length must be a whole number only (no decimals or letters)' };
    }
    if (width && width.trim() && !/^\d+(\.\d+)?$/.test(width.trim())) {
      return { valid: false, error: 'Width must be a whole number only (no letters)' };
    }
  }

  return { valid: true };
};

// ---------------------------------------------------------------------------
// Shared field styling (keeps Add/Edit inputs visually consistent)
// ---------------------------------------------------------------------------

export const FORM_LABEL_CLASS = 'block text-sm font-medium text-gray-900 mb-2';

export const FORM_INPUT_CLASS =
  'w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent';
