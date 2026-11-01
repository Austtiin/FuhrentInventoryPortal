import assert from 'node:assert/strict';
import { test } from 'node:test';
import writeXlsxFile from 'write-excel-file/node';
import { createInventoryWorksheet, toInventoryCsv } from '../src/lib/inventoryExport.ts';

const row = {
  UnitID: 42,
  StockNo: 'VH042',
  Year: 2025,
  Make: 'Ford',
  Model: 'F-150',
  VIN: 'TEST-VIN',
  Status: 'available',
  Condition: 'Used',
  Price: 35000,
};

test('Excel retains header order, numeric identifiers and currency formatting', () => {
  const sheet = createInventoryWorksheet([row]);
  assert.deepEqual(sheet[0].map(cell => cell.value), Object.keys(row));
  assert.equal(sheet[1][0].type, Number);
  assert.equal(sheet[1][2].type, Number);
  assert.equal(sheet[1][8].value, 35000);
  assert.equal(sheet[1][8].format, '"$"#,##0');
});

test('empty inventory retains headers; missing price is a blank string cell', () => {
  assert.equal(createInventoryWorksheet([]).length, 1);
  const sheet = createInventoryWorksheet([{ ...row, Price: '' }]);
  assert.equal(sheet[1][8].type, String);
  assert.equal(sheet[1][8].value, '');
  assert.equal(toInventoryCsv([]), Object.keys(row).join(','));
});

test('Excel strings cannot be interpreted as formulas and invalid numbers are rejected', () => {
  const sheet = createInventoryWorksheet([{ ...row, Make: '=1+1' }]);
  assert.equal(sheet[1][3].type, String);
  assert.equal(sheet[1][3].value, '=1+1');
  assert.throws(() => createInventoryWorksheet([{ ...row, Price: NaN }]), /Invalid Price/);
  assert.throws(() => createInventoryWorksheet([{ ...row, UnitID: Infinity }]), /Invalid UnitID/);
});

test('CSV escapes quotes, commas, carriage returns and line breaks', () => {
  const csv = toInventoryCsv([{ ...row, Make: 'A,"B"', Model: 'Line\r\nTwo' }]);
  assert.ok(csv.includes('"A,""B"""'));
  assert.ok(csv.includes('"Line\r\nTwo"'));
});

test('CSV neutralizes text formulas without changing numeric negative values', () => {
  for (const Make of ['=1+1', '+1+1', '-1+1', '@SUM(A1)', '  =1+1', '\t=1+1', '\r=1+1']) {
    assert.ok(toInventoryCsv([{ ...row, Make }]).includes(`'${Make}`));
  }
  assert.ok(toInventoryCsv([{ ...row, Price: -12 }]).endsWith(',-12'));
});

test('replacement writer produces real Excel workbooks for populated and empty inventory', async () => {
  for (const rows of [[row], []]) {
    const buffer = await writeXlsxFile(createInventoryWorksheet(rows), { sheet: 'Inventory' }).toBuffer();
    assert.equal(buffer.subarray(0, 2).toString(), 'PK');
    assert.ok(buffer.includes(Buffer.from('xl/worksheets/sheet1.xml')));
    assert.ok(buffer.includes(Buffer.from('xl/styles.xml')));
  }
});
