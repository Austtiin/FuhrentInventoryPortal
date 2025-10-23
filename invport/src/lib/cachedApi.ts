/**
 * Deprecated compatibility layer
 *
 * The implementations have been consolidated into `serverApi.ts`.
 * To avoid a breaking change, we re-export the new helpers from here.
 */

export { 
  getInventory, 
  getInventoryShort, 
  imageExists, 
  getVehicleImages, 
  getDealershipImageExists, 
  getStaticConfig, 
  getRealTimeInventory, 
  cacheUtils, 
  cacheStats 
} from '@/lib/serverApi';

// NOTE: This file is a thin shim kept for backwards compatibility. Prefer
// importing directly from '@/lib/serverApi' in new code.

