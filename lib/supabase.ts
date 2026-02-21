import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Django backend API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Make API calls to Django backend
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Failed: ${url}`, error);
    throw error;
  }
};

/**
 * Health check
 */
export const checkHealth = () => apiCall('/health/', { method: 'GET' });

/**
 * Status check
 */
export const checkStatus = () => apiCall('/status/', { method: 'GET' });
