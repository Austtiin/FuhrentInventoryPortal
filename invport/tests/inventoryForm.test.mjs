import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateDimensions } from '../src/lib/inventoryForm.ts';

test('Aluma-Lite accepts a 5-foot width', () => {
  assert.deepEqual(validateDimensions('Aluma-Lite', '21V', '5'), { valid: true });
});

test('Aluma-Lite continues to reject unsupported widths', () => {
  assert.deepEqual(validateDimensions('Aluma-Lite', '21V', '7'), {
    valid: false,
    error: 'For Aluma-Lite, width must be 8, 6.5, 6, or 5',
  });
});
