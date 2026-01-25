const https = require('https');

/**
 * Calls the internal decodevins API
 * @param {string} vin - VIN to decode
 * @param {string} baseUrl - Base URL for the API (from environment or request)
 * @returns {Promise<object>} - API response
 */
async function callDecodeVinsApi(vin, baseUrl) {
  return new Promise((resolve, reject) => {
    // Construct the full URL
    const apiUrl = baseUrl ? `${baseUrl}/api/decodevins/${vin}` : null;
    
    if (!apiUrl) {
      reject(new Error('Base URL not provided for decodevins API'));
      return;
    }

    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const protocol = url.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          reject(new Error(`Failed to parse decodevins response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`DecodevinsAPI request failed: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Validates VIN format
 * @param {string} vin - VIN to validate
 * @returns {object} - Validation result
 */
function validateVIN(vin) {
  if (!vin || typeof vin !== 'string') {
    return { isValid: false, error: 'VIN is required' };
  }

  const cleanVin = vin.trim().toUpperCase();

  // VIN must be 17 characters
  if (cleanVin.length !== 17) {
    return { isValid: false, error: 'VIN must be exactly 17 characters' };
  }

  // VIN cannot contain I, O, or Q
  if (/[IOQ]/.test(cleanVin)) {
    return { isValid: false, error: 'VIN cannot contain letters I, O, or Q' };
  }

  // VIN must be alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
    return { isValid: false, error: 'VIN must contain only valid characters (A-Z, 0-9, excluding I, O, Q)' };
  }

  return { isValid: true, vin: cleanVin };
}

/**
 * Calls NHTSA VIN decode API
 * @param {string} vin - VIN to decode
 * @returns {Promise<object>} - API response
 */
function callNHTSAApi(vin) {
  return new Promise((resolve, reject) => {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
    
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse NHTSA response: ${error.message}`));
        }
      });

    }).on('error', (error) => {
      reject(new Error(`NHTSA API request failed: ${error.message}`));
    });
  });
}

/**
 * Transforms NHTSA response into our standardized format
 * @param {object} nhtsaResponse - Raw NHTSA API response
 * @param {string} vin - Original VIN
 * @returns {object} - Formatted response
 */
function transformNHTSAResponse(nhtsaResponse, vin) {
  const results = nhtsaResponse.Results || [];
  
  // Create a map for easy lookup
  const dataMap = {};
  results.forEach(item => {
    if (item.Value && item.Value !== 'Not Applicable' && item.Value !== '') {
      dataMap[item.Variable] = item.Value;
    }
  });

  // Extract warnings and errors
  const warnings = [];
  const errors = [];
  
  results.forEach(item => {
    // Check for error code (anything other than 0, 5, or 6 is typically fine)
    if (item.Variable === 'Error Code' && item.Value) {
      const errorCode = item.Value.trim();
      // Error codes: 0 = success, 5-6 = partial data, 8 = limited data
      // Only treat as real error if it's something else
      if (errorCode !== '0' && errorCode !== '5' && errorCode !== '6' && errorCode !== '8' && errorCode !== '') {
        errors.push(`Error Code: ${errorCode}`);
      }
    }
    // Check for error text - only if it doesn't start with "0 -"
    if (item.Variable === 'Error Text' && item.Value) {
      const errorText = item.Value.trim();
      if (!errorText.startsWith('0 -')) {
        errors.push(errorText);
      }
    }
    // Additional error text that suggests warnings, not errors
    if (item.Variable === 'Additional Error Text' && item.Value) {
      const additionalText = item.Value.trim();
      // These are typically warnings, not errors
      if (additionalText && !additionalText.startsWith('0 -')) {
        warnings.push(additionalText);
      }
    }
  });

  // Check for warnings in specific fields
  results.forEach(item => {
    if (item.Value && typeof item.Value === 'string') {
      const value = item.Value.trim();
      // Skip empty or "Not Applicable" values
      if (!value || value === 'Not Applicable' || value === '') {
        return;
      }
      
      // Common warning patterns (but not error patterns we already caught)
      if ((value.toLowerCase().includes('may not be accurate') ||
           value.toLowerCase().includes('may be incorrect')) &&
          !warnings.includes(value) && 
          !errors.includes(value)) {
        warnings.push(`${item.Variable}: ${value}`);
      }
    }
  });

  // Determine error level
  let errorLevel = null;
  let hasWarnings = warnings.length > 0;
  let success = errors.length === 0;

  if (errors.length > 0) {
    errorLevel = 'error';
    success = false;
  } else if (warnings.length > 0) {
    errorLevel = 'warning';
  }

  // Check if we should recommend calling /api/decodevins/[api]
  // This would be true if:
  // 1. There are significant missing fields
  // 2. The vehicle type suggests it needs more specific decoding
  // 3. There are warnings about decode accuracy
  const shouldUseAlternateApi = checkIfAlternateApiNeeded(dataMap, warnings);

  // Build the standardized response
  const response = {
    success,
    vin,
    hasWarnings,
    errorLevel,
    warnings: warnings.length > 0 ? warnings : undefined,
    errors: errors.length > 0 ? errors : undefined,
    useAlternateApi: shouldUseAlternateApi,
    data: {
      // Core vehicle information
      make: dataMap['Make'] || null,
      model: dataMap['Model'] || null,
      modelYear: dataMap['Model Year'] || null,
      vehicleType: dataMap['Vehicle Type'] || null,
      
      // Body and style
      bodyClass: dataMap['Body Class'] || null,
      bodyStyle: dataMap['Body Style'] || null,
      numberOfDoors: dataMap['Doors'] || null,
      
      // Trailer specific (if applicable)
      trailerType: dataMap['Trailer Type Connection'] || null,
      trailerLength: dataMap['Trailer Length (feet)'] || null,
      trailerBodyType: dataMap['Trailer Body Type'] || null,
      
      // Engine and drivetrain
      engineCylinders: dataMap['Engine Number of Cylinders'] || null,
      engineDisplacement: dataMap['Displacement (L)'] || dataMap['Displacement (CC)'] || null,
      engineHP: dataMap['Engine Brake (hp) From'] || null,
      fuelType: dataMap['Fuel Type - Primary'] || null,
      driveType: dataMap['Drive Type'] || null,
      transmission: dataMap['Transmission Style'] || null,
      
      // Size and weight
      gvwr: dataMap['Gross Vehicle Weight Rating From'] || null,
      gvwrTo: dataMap['Gross Vehicle Weight Rating To'] || null,
      
      // Manufacturing details
      manufacturer: dataMap['Manufacturer Name'] || null,
      plantCity: dataMap['Plant City'] || null,
      plantCountry: dataMap['Plant Country'] || null,
      plantCompanyName: dataMap['Plant Company Name'] || null,
      plantState: dataMap['Plant State'] || null,
      
      // Series and trim
      series: dataMap['Series'] || null,
      trim: dataMap['Trim'] || null,
      
      // Safety features
      abs: dataMap['ABS'] || null,
      airBagLocations: dataMap['Air Bag Locations'] || null,
      
      // Additional details
      entertainmentSystem: dataMap['Entertainment System'] || null,
      ncsa: dataMap['NCSA Make'] || null,
      ncsaModel: dataMap['NCSA Model'] || null,
    },
    timestamp: new Date().toISOString()
  };

  // Remove null values from data
  Object.keys(response.data).forEach(key => {
    if (response.data[key] === null) {
      delete response.data[key];
    }
  });

  return response;
}

/**
 * Determines if alternate API should be used
 * @param {object} dataMap - Parsed data from NHTSA
 * @param {Array} warnings - Warning messages
 * @returns {boolean} - Whether to use alternate API
 */
function checkIfAlternateApiNeeded(dataMap, warnings) {
  // Check for specific conditions that warrant alternate API
  
  // 1. If it's a trailer and basic decode is incomplete
  if (dataMap['Vehicle Type'] === 'TRAILER' && !dataMap['Trailer Type Connection']) {
    return true;
  }
  
  // 2. If there are multiple warnings about decode accuracy
  if (warnings.length >= 3) {
    return true;
  }
  
  // 3. If critical fields are missing
  const criticalFields = ['Make', 'Model', 'Model Year'];
  const missingCritical = criticalFields.filter(field => !dataMap[field]);
  if (missingCritical.length >= 2) {
    return true;
  }
  
  // 4. If manufacturer name suggests specialized decoding needed
  const specializedManufacturers = ['NORTH STAR', 'CUSTOM', 'HOMEMADE', 'ASSEMBLED'];
  if (dataMap['Manufacturer Name']) {
    const hasSpecialized = specializedManufacturers.some(mfg => 
      dataMap['Manufacturer Name'].includes(mfg)
    );
    if (hasSpecialized) {
      return true;
    }
  }
  
  return false;
}

/**
 * Azure Function handler
 */
module.exports = async function (context, req) {
  const startTime = Date.now();
  
  try {
    context.log('🔍 VIN Decode: Starting...');
    
    // Get VIN from route parameter
    const vin = req.params?.vin;
    
    // Get query parameters
    const useComprehensive = req.query?.comprehensive === 'true';
    const skipNhtsa = req.query?.skipNhtsa === 'true';
    
    // Validate VIN
    const validation = validateVIN(vin);
    if (!validation.isValid) {
      context.log(`❌ VIN validation failed: ${validation.error}`);
      
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: validation.error,
          errorLevel: 'error',
          timestamp: new Date().toISOString(),
          responseTimeMs: Date.now() - startTime
        }
      };
    }
    
    const cleanVin = validation.vin;
    context.log(`✅ VIN validated: ${cleanVin}`);
    
    let response;
    
    // If skipNhtsa is true or comprehensive is requested, go directly to decodevins API
    if (skipNhtsa || useComprehensive) {
      context.log('📡 Calling comprehensive decodevins API...');
      
      try {
        // Get base URL from environment or construct from request
        const baseUrl = process.env.API_BASE_URL || 
                       (req.headers['x-forwarded-host'] ? 
                         `https://${req.headers['x-forwarded-host']}` : 
                         'http://localhost:7071');
        
        const decodevinsResult = await callDecodeVinsApi(cleanVin, baseUrl);
        
        if (decodevinsResult.statusCode === 200) {
          context.log('✅ Comprehensive decode successful');
          response = decodevinsResult.data;
          response.source = 'decodevins';
          response.responseTimeMs = Date.now() - startTime;
        } else {
          context.log(`⚠️ Decodevins API returned status ${decodevinsResult.statusCode}`);
          // Fall back to NHTSA if decodevins fails
          if (!skipNhtsa) {
            context.log('📡 Falling back to NHTSA API...');
            const nhtsaResponse = await callNHTSAApi(cleanVin);
            response = transformNHTSAResponse(nhtsaResponse, cleanVin);
            response.source = 'nhtsa_fallback';
            response.decodevinsError = decodevinsResult.data;
          } else {
            return {
              status: decodevinsResult.statusCode,
              headers: { 'Content-Type': 'application/json' },
              body: decodevinsResult.data
            };
          }
        }
      } catch (error) {
        context.log(`⚠️ Decodevins API error: ${error.message}`);
        
        // Fall back to NHTSA if decodevins fails and skipNhtsa is not set
        if (!skipNhtsa) {
          context.log('📡 Falling back to NHTSA API...');
          const nhtsaResponse = await callNHTSAApi(cleanVin);
          response = transformNHTSAResponse(nhtsaResponse, cleanVin);
          response.source = 'nhtsa_fallback';
          response.decodevinsError = error.message;
        } else {
          throw error;
        }
      }
    } else {
      // Normal flow: Call NHTSA first
      context.log('📡 Calling NHTSA API...');
      const nhtsaResponse = await callNHTSAApi(cleanVin);
      context.log('✅ NHTSA API response received');
      
      // Transform response
      response = transformNHTSAResponse(nhtsaResponse, cleanVin);
      response.source = 'nhtsa';
      
      // If alternate API is recommended, optionally call it
      if (response.useAlternateApi) {
        context.log('🔄 Alternate API recommended, attempting comprehensive decode...');
        
        try {
          const baseUrl = process.env.API_BASE_URL || 
                         (req.headers['x-forwarded-host'] ? 
                           `https://${req.headers['x-forwarded-host']}` : 
                           null);
          
          if (baseUrl) {
            const decodevinsResult = await callDecodeVinsApi(cleanVin, baseUrl);
            
            if (decodevinsResult.statusCode === 200) {
              context.log('✅ Comprehensive decode successful, using enhanced data');
              response = decodevinsResult.data;
              response.source = 'decodevins_auto';
              response.nhtsaData = transformNHTSAResponse(nhtsaResponse, cleanVin).data;
            } else {
              context.log('⚠️ Comprehensive decode failed, using NHTSA data');
              response.decodevinsAttempted = true;
            }
          } else {
            context.log('⚠️ Base URL not available for comprehensive decode');
            response.decodevinsAttempted = false;
            response.decodevinsAvailable = false;
          }
        } catch (error) {
          context.log(`⚠️ Comprehensive decode error: ${error.message}`);
          response.decodevinsAttempted = true;
          response.decodevinsError = error.message;
        }
      }
    }
    
    // Add response time
    response.responseTimeMs = Date.now() - startTime;
    
    // Log result summary
    if (response.success) {
      context.log(`✅ VIN decoded successfully: ${response.data?.make} ${response.data?.model} ${response.data?.modelYear}`);
      if (response.useAlternateApi) {
        context.log('💡 Recommendation: Use /api/decodevins/{vin} for more detailed results');
      }
    } else {
      context.log(`⚠️ VIN decode completed with errors`);
    }
    
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: response
    };
    
  } catch (error) {
    context.log.error('❌ VIN decode error:', error);
    
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to decode VIN',
        errorLevel: 'error',
        details: error.message,
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime
      }
    };
  }
};
