export interface FeatureCategoryConfig {
  name: string;
  keywords: string[]; // lowercased keywords to match in feature name
}

// Name used for any features that don't match a known category.
export const UNSORTED_FEATURE_CATEGORY = 'Unsorted';

// Feature grouping and sort order for the inventory feature selector.
// Keywords should be lowercased and generally mirror the feature names in the database.
// Any features that do not match one of these keyword sets will fall into the
// `UNSORTED_FEATURE_CATEGORY` bucket, which is always rendered at the bottom.
export const FEATURE_CATEGORIES: FeatureCategoryConfig[] = [
  {
    name: 'Frame & Chassis',
    keywords: [
      'gs frame',
      'berkon frame',
      'valley frame',
      'hydraulic frame',
      'crank frame',
      'painted frame',
      'galvanized dipped frame',
      'galvanised dipped frame',
      'hd axel',
      'hd axle',
      'hd axles',
    ],
  },
  {
    name: 'Model / Build Type',
    keywords: [
      'rv edition',
      'non-rv edition',
      'non rv edition',
      'toy hauler',
      'skid house',
      'extreme edition',
    ],
  },
  {
    name: 'Exterior Structure & Body',
    keywords: [
      'metal siding',
      'fiberglass siding',
      'black stoneguard',
      'silver stoneguard',
      'v-nose',
      'v nose',
      'stub nose',
      'bay window',
      'picture window',
      'wheel skirts',
      'rear screen',
      'ramp door',
      'fish house door',
      'rv door w/ screen',
      'rv door with screen',
      'black window frames',
      'custom decals',
    ],
  },
  {
    name: 'Interior Layout & Sleeping',
    keywords: [
      'front v-bunks',
      'front v bunks',
      '30in upper bunk',
      '30 in upper bunk',
      '48in upper bunk',
      '48 in upper bunk',
      'bunk ladder',
      'bunk rail',
      'jack knife sofa',
      'roll-over sofas',
      'roll over sofas',
      'recliner w/ ottoman',
      'recliner with ottoman',
      'power lift bed 48',
      'power lift bed 54',
      'power lift bed 60',
      'cabinets to hide power lift bed',
    ],
  },
  {
    name: 'Interior Finishes',
    keywords: [
      'cedar interior',
      'pine interior',
      'wall board',
      'brown stain interior',
      'gray stain interior',
      'grey stain interior',
      'rubber floor',
      'linoleum floor',
      'carpet floor',
      'cove ceiling w/ led',
      'cove ceiling with led',
      'curtains',
      'blinds',
    ],
  },
  {
    name: 'Furniture & Dinette',
    keywords: [
      '48" dinette',
      '48 in dinette',
      '48in dinette',
      '30" dinette',
      '30 in dinette',
      '30in dinette',
      'table storage',
      'table lift – castle winch',
      'table lift - castle winch',
      'table lift – smith',
      'table lift - smith',
      'drawers',
    ],
  },
  {
    name: 'Kitchen & Appliances',
    keywords: [
      '2 burner cooktop',
      'two burner cooktop',
      '3 burner cooktop',
      'three burner cooktop',
      '3 burner stove w/ oven',
      '3 burner stove with oven',
      'furrion stove w/ oven',
      'furrion stove with oven',
      'microwave',
      'range hood',
      'rv gas/elec fridge small',
      'rv gas/elec fridge large',
      '110v ss fridge large',
      '110v fridge large',
      '110v dorm fridge',
      'double sink',
      'single sink',
      'dry sink',
    ],
  },
  {
    name: 'Bathroom & Water Systems',
    keywords: [
      'dry flush toilet',
      'fresh water toilet',
      'toilet seat',
      'large shower',
      'corner shower',
      'bathroom sink',
      'city water',
      'fresh water',
      'fresh water package',
      'gray water by-pass',
      'gray water bypass',
      '2nd gray tank',
      'second gray tank',
      '6 gal. gas water heater',
      '6 gal gas water heater',
      'on demand water heater',
    ],
  },
  {
    name: 'Climate & Ventilation',
    keywords: [
      'a/c',
      'ac ',
      ' a/c',
      ' a c ',
      '35k furnace',
      '30k furnace',
      '20k furnace',
      'maxx air fan',
      'ceiling fan',
      'arctic package',
      'spray foam floor',
    ],
  },
  {
    name: 'Electrical, Lighting & Power',
    keywords: [
      'led light bar',
      'strobe lights',
      'hole lights',
      'solar panel',
      'king jack antenna',
      '2nd tv location',
      'second tv location',
      'tv included',
    ],
  },
  {
    name: 'Audio & Entertainment',
    keywords: [
      'interior speakers',
      'exterior speakers',
      'outdoor speakers',
      'fireplace',
    ],
  },
  {
    name: 'Fishing Features',
    keywords: [
      'spear hole',
      'rattle reels included',
      'rod holders included',
      'hole sleeves included',
      'live bait well',
    ],
  },
  {
    name: 'Exterior Accessories',
    keywords: [
      'power awning',
      'tow bar',
      'receiver hitch',
      'flag pole mount',
      'spare tire',
      'spare tire mount',
      'spare tire cover',
      'sure step',
      'b & b propane box',
      'bb propane box',
      'exterior pump box',
      'atv tie-downs',
      'atv tie downs',
    ],
  },
  {
    name: 'Seating & Mobility',
    keywords: [
      'boat seat installed',
      'slide-out',
      'slide out',
    ],
  },
  {
    name: 'Hitch & Towing',
    keywords: [
      '2 inch ball',
      '2" ball',
      '2 5/16 inch ball',
      '2 5\/16 inch ball',
      '2 5/16" ball',
    ],
  },
];

export function detectFeatureCategory(name: string, categories: FeatureCategoryConfig[]): string {
  const n = (name || '').toLowerCase();
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (kw && n.includes(kw)) return cat.name;
    }
  }
  return UNSORTED_FEATURE_CATEGORY;
}
