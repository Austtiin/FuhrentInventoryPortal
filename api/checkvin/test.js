// Test script for checkvin function
const checkvinHandler = require('./index');

// Mock context object
const createMockContext = () => {
  const log = (...args) => console.log('[LOG]', ...args);
  log.error = (...args) => console.error('[ERROR]', ...args);
  return { log };
};

// Test cases
const testCases = [
  {
    name: 'Valid VIN - Trailer',
    vin: '1N9BL1714RW414011'
  },
  {
    name: 'Valid VIN - Car',
    vin: '1HGBH41JXMN109186'
  },
  {
    name: 'Invalid VIN - Too short',
    vin: '1HGBH41JX'
  },
  {
    name: 'Invalid VIN - Contains I',
    vin: '1HGBH41JXMNI09186'
  },
  {
    name: 'Invalid VIN - Contains O',
    vin: '1HGBH41JXMNO09186'
  }
];

async function runTests() {
  console.log('🧪 Starting VIN Decode Function Tests\n');
  
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test: ${testCase.name}`);
    console.log(`VIN: ${testCase.vin}`);
    console.log('='.repeat(60));
    
    const mockContext = createMockContext();
    const mockReq = {
      params: { vin: testCase.vin }
    };
    
    try {
      const result = await checkvinHandler(mockContext, mockReq);
      
      console.log(`\nStatus: ${result.status}`);
      console.log(`Response:`, JSON.stringify(result.body, null, 2));
      
      if (result.body.success) {
        console.log('\n✅ Test passed - VIN decoded successfully');
        if (result.body.useAlternateApi) {
          console.log('⚠️ Recommends using alternate API');
        }
      } else {
        console.log('\n⚠️ Test completed with errors (expected for invalid VINs)');
      }
    } catch (error) {
      console.error('\n❌ Test failed with exception:', error.message);
    }
  }
  
  console.log('\n\n🏁 All tests completed\n');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
