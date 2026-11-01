import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inventoryRecords, normalizeInventoryVehicle } from '../src/lib/inventoryResponse.ts';

test('details accept direct, data and vehicles inventory responses', () => {
  const units = [{ UnitID: 42, Year: 2025, Make: 'Ford', Model: 'F-150' }];
  for (const response of [units, { data: units }, { vehicles: units }]) {
    assert.equal(normalizeInventoryVehicle(inventoryRecords(response)[0]).id, '42');
  }
  assert.deepEqual(inventoryRecords([]), []);
  for (const response of [null, {}, { data: null }, [null], [['not a unit']]]) {
    assert.throws(() => inventoryRecords(response), /Invalid inventory response/);
  }
});

test('details normalize ID variants, preserve measured zero values and marketing banners', () => {
  for (const key of ['UnitID', 'UnitId', 'unitId', 'id']) {
    const unit = normalizeInventoryVehicle({
      [key]: 42, Year: 2025, Make: 'Ford', Model: 'F-150', Price: 0,
      Mileage: 0, MSRP: 40000, TypeID: 1, Status: 'Available', Banner: 'Featured',
    });
    assert.equal(unit.id, '42');
    assert.equal(unit.unitId, 42);
    assert.equal(unit.price, 0);
    assert.equal(unit.mileage, 0);
    assert.equal(unit.typeId, 1);
    assert.equal(unit.status, 'available');
    assert.equal(unit.banner, 'Featured');
    assert.equal(unit.name, '2025 Ford F-150');
  }
});
