# Utility Functions Documentation

This guide documents utility functions and helper modules used throughout the Deep Research Cockpit frontend application.

## Table of Contents

- [Overview](#overview)
- [String Utilities](#string-utilities)
- [Date & Time Utilities](#date--time-utilities)
- [Formatting Utilities](#formatting-utilities)
- [Validation Utilities](#validation-utilities)
- [Array & Object Utilities](#array--object-utilities)
- [API Utilities](#api-utilities)
- [Browser Utilities](#browser-utilities)
- [Type Utilities](#type-utilities)

## Overview

Utility functions are pure, testable functions that perform common operations across the application. They follow these principles:

- **Pure Functions**: No side effects
- **Type-Safe**: Full TypeScript support
- **Well-Tested**: Comprehensive test coverage
- **Documented**: Clear JSDoc comments
- **Reusable**: Generic and composable

## String Utilities

### truncate

**Status**: Planned

Truncate string to specified length with ellipsis.

```typescript
/**
 * Truncate string to maximum length
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to append (default: '...')
 * @returns Truncated string
 *
 * @example
 * ```typescript
 * truncate('Long text here', 10); // "Long te..."
 * truncate('Short', 10); // "Short"
 * ```
 */
export const truncate = (
  str: string,
  maxLength: number,
  suffix = '...'
): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
};
```

### capitalize

**Status**: Planned

Capitalize first letter of string.

```typescript
/**
 * Capitalize first letter of string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 *
 * @example
 * ```typescript
 * capitalize('hello'); // "Hello"
 * capitalize('HELLO'); // "HELLO"
 * ```
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};
```

### slugify

**Status**: Planned

Convert string to URL-friendly slug.

```typescript
/**
 * Convert string to URL slug
 *
 * @param str - String to slugify
 * @returns URL-safe slug
 *
 * @example
 * ```typescript
 * slugify('Hello World!'); // "hello-world"
 * slugify('Résumé 2024'); // "resume-2024"
 * ```
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
```

### parseTemplate

**Status**: Planned

Parse template string with variables.

```typescript
/**
 * Parse template string with variables
 *
 * @param template - Template string with {variable} syntax
 * @param variables - Variable values
 * @returns Parsed string
 *
 * @example
 * ```typescript
 * parseTemplate('Hello {name}!', { name: 'World' }); // "Hello World!"
 * parseTemplate('{count} items', { count: 5 }); // "5 items"
 * ```
 */
export const parseTemplate = (
  template: string,
  variables: Record<string, unknown>
): string => {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(variables[key] ?? ''));
};
```

## Date & Time Utilities

### formatDate

**Status**: Planned

Format date with various formats.

```typescript
/**
 * Format date to string
 *
 * @param date - Date to format
 * @param format - Format string or preset
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(new Date(), 'short'); // "1/15/24"
 * formatDate(new Date(), 'long'); // "January 15, 2024"
 * formatDate(new Date(), 'iso'); // "2024-01-15T10:30:00Z"
 * ```
 */
export const formatDate = (
  date: Date | string | number,
  format: DateFormat = 'short'
): string => {
  const d = new Date(date);

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      });
    case 'long':
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    case 'iso':
      return d.toISOString();
    default:
      return d.toLocaleDateString();
  }
};

type DateFormat = 'short' | 'long' | 'iso' | 'relative';
```

### formatRelativeTime

**Status**: Planned

Format time relative to now.

```typescript
/**
 * Format time relative to current time
 *
 * @param date - Date to format
 * @returns Relative time string
 *
 * @example
 * ```typescript
 * formatRelativeTime(Date.now() - 60000); // "1 minute ago"
 * formatRelativeTime(Date.now() + 86400000); // "in 1 day"
 * ```
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const absDiff = Math.abs(diff);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absDiff < minute) return rtf.format(Math.round(-diff / 1000), 'second');
  if (absDiff < hour) return rtf.format(Math.round(-diff / minute), 'minute');
  if (absDiff < day) return rtf.format(Math.round(-diff / hour), 'hour');
  if (absDiff < week) return rtf.format(Math.round(-diff / day), 'day');
  return rtf.format(Math.round(-diff / week), 'week');
};
```

### isValidDate

**Status**: Planned

Check if value is valid date.

```typescript
/**
 * Check if value is valid date
 *
 * @param value - Value to check
 * @returns True if valid date
 *
 * @example
 * ```typescript
 * isValidDate(new Date()); // true
 * isValidDate('2024-01-15'); // true
 * isValidDate('invalid'); // false
 * ```
 */
export const isValidDate = (value: unknown): boolean => {
  if (value instanceof Date) return !isNaN(value.getTime());
  const date = new Date(value as string | number);
  return !isNaN(date.getTime());
};
```

## Formatting Utilities

### formatNumber

**Status**: Planned

Format number with locale and options.

```typescript
/**
 * Format number with locale settings
 *
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1234567.89); // "1,234,567.89"
 * formatNumber(0.5, { style: 'percent' }); // "50%"
 * formatNumber(1234.56, { style: 'currency', currency: 'USD' }); // "$1,234.56"
 * ```
 */
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-US', options).format(value);
};
```

### formatBytes

**Status**: Planned

Format bytes to human-readable size.

```typescript
/**
 * Format bytes to human-readable size
 *
 * @param bytes - Number of bytes
 * @param decimals - Decimal places (default: 2)
 * @returns Formatted size string
 *
 * @example
 * ```typescript
 * formatBytes(1024); // "1.00 KB"
 * formatBytes(1048576); // "1.00 MB"
 * formatBytes(1073741824, 1); // "1.0 GB"
 * ```
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};
```

### formatDuration

**Status**: Planned

Format milliseconds to duration string.

```typescript
/**
 * Format duration in milliseconds
 *
 * @param ms - Duration in milliseconds
 * @param format - Output format
 * @returns Formatted duration
 *
 * @example
 * ```typescript
 * formatDuration(3661000); // "1h 1m 1s"
 * formatDuration(90000, 'compact'); // "1m 30s"
 * ```
 */
export const formatDuration = (
  ms: number,
  format: 'long' | 'compact' = 'long'
): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  if (format === 'compact') {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
  }

  return [
    hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''}`,
    minutes > 0 && `${minutes} minute${minutes !== 1 ? 's' : ''}`,
    seconds > 0 && `${seconds} second${seconds !== 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');
};
```

## Validation Utilities

### isEmail

**Status**: Planned

Validate email address format.

```typescript
/**
 * Validate email address
 *
 * @param email - Email to validate
 * @returns True if valid email
 *
 * @example
 * ```typescript
 * isEmail('user@example.com'); // true
 * isEmail('invalid-email'); // false
 * ```
 */
export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### isURL

**Status**: Planned

Validate URL format.

```typescript
/**
 * Validate URL
 *
 * @param url - URL to validate
 * @returns True if valid URL
 *
 * @example
 * ```typescript
 * isURL('https://example.com'); // true
 * isURL('not-a-url'); // false
 * ```
 */
export const isURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

### validatePassword

**Status**: Planned

Validate password strength.

```typescript
/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * validatePassword('weak'); // { valid: false, errors: ['Too short'] }
 * validatePassword('Strong123!'); // { valid: true, errors: [] }
 * ```
 */
export const validatePassword = (
  password: string,
  options: PasswordOptions = {}
): ValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`Must be at least ${minLength} characters`);
  }
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Must contain lowercase letter');
  }
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Must contain number');
  }
  if (requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    errors.push('Must contain special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

interface PasswordOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

## Array & Object Utilities

### groupBy

**Status**: Planned

Group array items by key.

```typescript
/**
 * Group array items by key
 *
 * @param array - Array to group
 * @param key - Key or function to group by
 * @returns Grouped object
 *
 * @example
 * ```typescript
 * const items = [
 *   { category: 'A', value: 1 },
 *   { category: 'B', value: 2 },
 *   { category: 'A', value: 3 },
 * ];
 * groupBy(items, 'category');
 * // { A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }], B: [...] }
 * ```
 */
export const groupBy = <T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
};
```

### sortBy

**Status**: Planned

Sort array by key with direction.

```typescript
/**
 * Sort array by key
 *
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param direction - Sort direction
 * @returns Sorted array
 *
 * @example
 * ```typescript
 * sortBy([{ name: 'C' }, { name: 'A' }], 'name'); // [{ name: 'A' }, { name: 'C' }]
 * sortBy([{ age: 30 }, { age: 20 }], 'age', 'desc'); // [{ age: 30 }, { age: 20 }]
 * ```
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};
```

### deepClone

**Status**: Planned

Deep clone object or array.

```typescript
/**
 * Deep clone object or array
 *
 * @param value - Value to clone
 * @returns Cloned value
 *
 * @example
 * ```typescript
 * const original = { a: { b: 1 } };
 * const cloned = deepClone(original);
 * cloned.a.b = 2; // original.a.b is still 1
 * ```
 */
export const deepClone = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value));
};
```

### deepMerge

**Status**: Planned

Deep merge objects.

```typescript
/**
 * Deep merge objects
 *
 * @param target - Target object
 * @param sources - Source objects
 * @returns Merged object
 *
 * @example
 * ```typescript
 * deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
 * // { a: 1, b: { c: 2, d: 3 } }
 * ```
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      target[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      target[key] = sourceValue as T[Extract<keyof T, string>];
    }
  });

  return deepMerge(target, ...sources);
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};
```

## API Utilities

### buildQueryString

**Status**: Planned

Build URL query string from params.

```typescript
/**
 * Build query string from params object
 *
 * @param params - Query parameters
 * @returns Query string
 *
 * @example
 * ```typescript
 * buildQueryString({ page: 1, sort: 'name' }); // "?page=1&sort=name"
 * buildQueryString({ filter: ['a', 'b'] }); // "?filter=a&filter=b"
 * ```
 */
export const buildQueryString = (
  params: Record<string, unknown>
): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach(item => query.append(key, String(item)));
    } else {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};
```

### parseQueryString

**Status**: Planned

Parse query string to params object.

```typescript
/**
 * Parse query string to params object
 *
 * @param queryString - Query string
 * @returns Params object
 *
 * @example
 * ```typescript
 * parseQueryString('?page=1&sort=name'); // { page: '1', sort: 'name' }
 * ```
 */
export const parseQueryString = (
  queryString: string
): Record<string, string | string[]> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string | string[]> = {};

  params.forEach((value, key) => {
    if (key in result) {
      const existing = result[key];
      result[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      result[key] = value;
    }
  });

  return result;
};
```

## Browser Utilities

### copyToClipboard

**Status**: Planned

Copy text to clipboard.

```typescript
/**
 * Copy text to clipboard
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 *
 * @example
 * ```typescript
 * await copyToClipboard('Hello World');
 * ```
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};
```

### downloadFile

**Status**: Planned

Trigger file download.

```typescript
/**
 * Trigger file download
 *
 * @param data - File data (Blob, string, or object)
 * @param filename - Download filename
 * @param mimeType - MIME type
 *
 * @example
 * ```typescript
 * downloadFile('Hello World', 'hello.txt', 'text/plain');
 * downloadFile({ data: 'value' }, 'data.json', 'application/json');
 * ```
 */
export const downloadFile = (
  data: Blob | string | object,
  filename: string,
  mimeType = 'application/octet-stream'
): void => {
  let blob: Blob;

  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: mimeType });
  } else {
    blob = new Blob([JSON.stringify(data, null, 2)], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

## Type Utilities

### Type Guards

**Status**: Planned

Runtime type checking utilities.

```typescript
/**
 * Check if value is defined (not null or undefined)
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Check if value is string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Check if value is number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Check if value is array
 */
export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};
```

## Resources

- [JavaScript Array Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

Last updated: 2025-10-28
