/**
 * Input validation and sanitization utilities
 * Provides functions to validate and sanitize user input
 */

import type { GeoJSON } from 'geojson';

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Validate and sanitize text input
 */
export function validateText(
  input: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): string {
  const { required = true, minLength = 1, maxLength = 1000 } = options;
  
  if (input === null || input === undefined || input === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return '';
  }
  
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  const sanitized = sanitizeString(input, maxLength);
  
  if (sanitized.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (sanitized.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }
  
  return sanitized;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  input: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): T {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  if (!allowedValues.includes(input as T)) {
    throw new Error(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  
  return input as T;
}

/**
 * Validate positive integer
 */
export function validatePositiveInteger(
  input: unknown,
  fieldName: string,
  options: {
    min?: number;
    max?: number;
  } = {}
): number {
  const { min = 1, max = Number.MAX_SAFE_INTEGER } = options;
  
  const num = Number(input);
  
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(
      `${fieldName} must be an integer between ${min} and ${max}`
    );
  }
  
  return num;
}

/**
 * Validate UUID format
 */
export function validateUUID(input: unknown, fieldName: string): string {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(input)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
  
  return input.toLowerCase();
}

/**
 * Validate GeoJSON object
 */
export function validateGeoJSON(input: unknown, fieldName: string): GeoJSON {
  if (!input || typeof input !== 'object') {
    throw new Error(`${fieldName} must be a valid GeoJSON object`);
  }
  
  const geojson = input as any;
  
  // Basic GeoJSON validation
  if (!geojson.type) {
    throw new Error(`${fieldName} must have a 'type' property`);
  }
  
  const validTypes = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection',
    'Feature',
    'FeatureCollection',
  ];
  
  if (!validTypes.includes(geojson.type)) {
    throw new Error(`${fieldName} has invalid GeoJSON type: ${geojson.type}`);
  }
  
  // Additional validation for geometry types
  if (
    ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(
      geojson.type
    )
  ) {
    if (!Array.isArray(geojson.coordinates)) {
      throw new Error(`${fieldName} geometry must have coordinates array`);
    }
  }
  
  // Validate Feature
  if (geojson.type === 'Feature') {
    if (!geojson.geometry) {
      throw new Error(`${fieldName} Feature must have a geometry property`);
    }
  }
  
  // Validate FeatureCollection
  if (geojson.type === 'FeatureCollection') {
    if (!Array.isArray(geojson.features)) {
      throw new Error(`${fieldName} FeatureCollection must have a features array`);
    }
  }
  
  // Size check to prevent DoS
  const jsonString = JSON.stringify(geojson);
  const maxSize = 1024 * 1024; // 1MB
  
  if (jsonString.length > maxSize) {
    throw new Error(`${fieldName} is too large (max 1MB)`);
  }
  
  return geojson as GeoJSON;
}

/**
 * Validate zone type
 */
export const ZONE_TYPES = ['grass', 'waste', 'maintenance'] as const;
export type ZoneType = typeof ZONE_TYPES[number];

export function validateZoneType(input: unknown): ZoneType {
  return validateEnum(input, 'Zone type', ZONE_TYPES);
}

/**
 * Validate task type
 */
export const TASK_TYPES = ['mowing', 'waste', 'maintenance'] as const;
export type TaskType = typeof TASK_TYPES[number];

export function validateTaskType(input: unknown): TaskType {
  return validateEnum(input, 'Task type', TASK_TYPES);
}

/**
 * Sanitize error message to prevent information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose database errors or stack traces in production
    if (process.env.NODE_ENV === 'production') {
      // Generic message for production
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return 'A record with this data already exists';
      }
      if (error.message.includes('foreign key') || error.message.includes('reference')) {
        return 'Invalid reference to related data';
      }
      if (error.message.includes('permission') || error.message.includes('RLS')) {
        return 'Permission denied';
      }
      return 'An error occurred while processing your request';
    }
    
    // Return actual message in development
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
