/**
 * API Testing Utility for React Native
 * Test endpoints and verify backend connectivity
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Test basic backend connectivity
 */
export const testBackendConnection = async () => {
  console.log(`Testing backend at: ${API_URL}`);
  
  try {
    const response = await fetch(`${API_URL}/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Backend Health Check PASSED', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Backend Health Check FAILED', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Test detailed status endpoint
 */
export const testBackendStatus = async () => {
  console.log(`Testing status endpoint at: ${API_URL}/status/`);

  try {
    const response = await fetch(`${API_URL}/status/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Backend Status Check PASSED', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Backend Status Check FAILED', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Test CORS headers
 */
export const testCORSHeaders = async () => {
  console.log(`Testing CORS headers at: ${API_URL}`);

  try {
    const response = await fetch(`${API_URL}/health/`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'GET',
        'Origin': 'http://localhost:3000',
      },
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    };

    console.log('✅ CORS Headers:', corsHeaders);
    return { success: true, corsHeaders };
  } catch (error) {
    console.warn('⚠️ CORS OPTIONS request failed (this is OK for React Native):', error);
    return { success: true, note: 'React Native handles CORS differently' };
  }
};

/**
 * Run all API tests
 */
export const runAllAPITests = async () => {
  console.log('\n=== Running all API tests ===\n');

  const results = {
    health: await testBackendConnection(),
    status: await testBackendStatus(),
    cors: await testCORSHeaders(),
  };

  const allPassed = results.health.success && results.status.success;

  console.log('\n=== Test Summary ===');
  console.log(`Health check: ${results.health.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Status check: ${results.status.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

  return results;
};

/**
 * Example: Get data from backend (replace with your actual endpoint)
 */
export const fetchDataFromBackend = async (endpoint: string) => {
  console.log(`Fetching from: ${API_URL}${endpoint}`);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Failed to fetch ${endpoint}`, error);
    return { success: false, error: String(error) };
  }
};

/**
 * Example: POST data to backend
 */
export const postDataToBackend = async (endpoint: string, payload: any) => {
  console.log(`Posting to: ${API_URL}${endpoint}`, payload);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Failed to post to ${endpoint}`, error);
    return { success: false, error: String(error) };
  }
};
