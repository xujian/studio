import type { CamelCasedProperties } from 'type-fest'

/**
 * Converts object keys from snake_case to camelCase
 */
export function camelizeKeys<T extends object>(obj: T): CamelCasedProperties<T> {
  if (!obj || typeof obj !== 'object') {
    return obj as CamelCasedProperties<T>
  }

  const result: Record<string, unknown> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = obj[key]
    }
  }

  return result as CamelCasedProperties<T>
}
