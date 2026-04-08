/**
 * Environment variable validation and type-safe access
 * Validates required environment variables at runtime
 */

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  
  if (!value && required) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please check your .env file and .env.example for reference.`
    );
  }
  
  return value || '';
}

function validateUrl(url: string, varName: string): string {
  try {
    new URL(url);
    return url;
  } catch (error) {
    throw new Error(`Invalid URL format for ${varName}: ${url}`);
  }
}

// Validate and export environment variables
export const env = {
  supabase: {
    url: validateUrl(
      getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      'NEXT_PUBLIC_SUPABASE_URL'
    ),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false),
  },
  security: {
    allowedOrigins: getEnvVar('ALLOWED_ORIGINS', false)
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
    rateLimitMax: parseInt(getEnvVar('RATE_LIMIT_MAX', false) || '60', 10),
    rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', false) || '60000', 10),
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Validate on module load
if (typeof window === 'undefined') {
  // Server-side validation only
  if (process.env.NODE_ENV === 'development') {
    console.log('✓ Environment variables validated successfully');
  }
}
