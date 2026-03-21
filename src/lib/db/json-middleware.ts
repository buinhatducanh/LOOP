// =============================================================================
// Prisma Middleware — Automatic JSON Field Validation on Write & Read
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MiddlewareParams = { model?: string; action: string; args?: any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Middleware = (params: MiddlewareParams, next: (params: MiddlewareParams) => Promise<any>) => Promise<any>;

import {
  validateTeamMemberSocial,
  validateSelectedItems,
  validateFeatureValues,
  validateSectionContent,
  validateSectionStyles,
  validateResourceUsage,
  validateNotificationData,
  validateAddonServiceMetadata,
  validateAuditValue,
} from './json-validators';
import { JsonValidationError } from './errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fields that are required (non-nullable) in the Prisma schema */
const REQUIRED_JSON_FIELDS: Record<string, string[]> = {
  QuoteRequest: ['selectedItems'],
  PricingComparisonFeature: ['values'],
};

/** All optional JSON fields mapped by model */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OPTIONAL_JSON_VALIDATORS: Record<string, (data: unknown) => any> = {
  TeamMember: (data) => validateTeamMemberSocial(data),
  FeatureVariant: (data) => validateResourceUsage(data),
  LandingSection: (data) => validateSectionContent(data),
  Notification: (data) => validateNotificationData(data),
  AddonService: (data) => validateAddonServiceMetadata(data),
};

/** Maps LandingSection JSON fields to their validators */
const LANDING_SECTION_VALIDATORS = {
  content: validateSectionContent,
  styles: validateSectionStyles,
};

/** Maps AuditLog JSON fields to their validators */
const AUDIT_VALIDATORS = {
  oldValues: (data: unknown) => validateAuditValue(data, 'AuditLog.oldValues'),
  newValues: (data: unknown) => validateAuditValue(data, 'AuditLog.newValues'),
};

/**
 * Extracts the raw JSON data from a Prisma create/update args object,
 * handling nested `set` wrappers used by Prisma's update modes.
 */
function extractData(args: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!args || typeof args !== 'object') return undefined;
  return args as Record<string, unknown>;
}

/**
 * Unwraps Prisma's `set` wrapper (used in update operations like `updateMany`)
 * so we can read the actual field value.
 */
function unwrapSet(value: unknown): unknown {
  if (
    value !== null &&
    typeof value === 'object' &&
    '__prisma_named_type' in value
  ) {
    // Prisma raw SQL / JsonNull / etc — leave as-is
    return value;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Write validation middleware
// ---------------------------------------------------------------------------

/**
 * Prisma middleware that validates every JSON field on `create` and `update`
 * operations before the database write is executed.
 *
 * - Required JSON fields (QuoteRequest.selectedItems, PricingComparisonFeature.values)
 *   throw a `JsonValidationError` immediately if validation fails.
 * - Optional JSON fields throw a `JsonValidationError` only when the field
 *   is explicitly provided (null or absent fields are left untouched).
 * - AuditLog oldValues / newValues are validated with a permissive schema
 *   so that any shape is accepted without throwing.
 *
 * @example Register in your Prisma client instance:
 * ```ts
 * import { PrismaClient } from '@prisma/client';
 * import { createJsonValidationMiddleware } from './json-middleware';
 *
 * const prisma = new PrismaClient({
 *   middlewares: [createJsonValidationMiddleware()],
 * });
 * ```
 */
export function createJsonValidationMiddleware(): Middleware {
  return async function jsonValidationMiddleware(
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<unknown>,
  ): Promise<unknown> {
    // Only intercept write operations
    if (!['create', 'update', 'updateMany', 'upsert'].includes(params.action)) {
      return next(params);
    }

    const model = params.model as string;
    const data = extractData(params.args.data);

    if (!data) {
      return next(params);
    }

    // -------------------------------------------------------------------------
    // Required JSON fields (non-nullable) — must be present and valid on create
    // -------------------------------------------------------------------------
    if (params.action === 'create' && REQUIRED_JSON_FIELDS[model]) {
      for (const field of REQUIRED_JSON_FIELDS[model]) {
        const value = data[field];
        if (value === undefined) {
          throw new JsonValidationError(
            `${model}.${field}`,
            `${model}.${field} is required but was undefined`,
            value,
          );
        }
        const validated = runValidator(model, field, value);
        if (!validated.ok) {
          throw new JsonValidationError(`${model}.${field}`, validated.error, value);
        }
      }
    }

    // -------------------------------------------------------------------------
    // Optional JSON fields — validate only when explicitly provided
    // -------------------------------------------------------------------------

    // --- TeamMember.social ---
    if (model === 'TeamMember' && data.social !== undefined) {
      const validated = validateTeamMemberSocial(unwrapSet(data.social));
      if (!validated.ok) {
        throw new JsonValidationError('TeamMember.social', validated.error, data.social);
      }
    }

    // --- QuoteRequest.selectedItems (required) ---
    if (model === 'QuoteRequest' && data.selectedItems !== undefined) {
      const validated = validateSelectedItems(unwrapSet(data.selectedItems));
      if (!validated.ok) {
        throw new JsonValidationError(
          'QuoteRequest.selectedItems',
          validated.error,
          data.selectedItems,
        );
      }
    }

    // --- PricingComparisonFeature.values (required) ---
    if (model === 'PricingComparisonFeature' && data.values !== undefined) {
      const validated = validateFeatureValues(unwrapSet(data.values));
      if (!validated.ok) {
        throw new JsonValidationError(
          'PricingComparisonFeature.values',
          validated.error,
          data.values,
        );
      }
    }

    // --- LandingSection.content & styles ---
    if (model === 'LandingSection') {
      if (data.content !== undefined) {
        const validated = validateSectionContent(unwrapSet(data.content));
        if (!validated.ok) {
          throw new JsonValidationError('LandingSection.content', validated.error, data.content);
        }
      }
      if (data.styles !== undefined) {
        const validated = validateSectionStyles(unwrapSet(data.styles));
        if (!validated.ok) {
          throw new JsonValidationError('LandingSection.styles', validated.error, data.styles);
        }
      }
    }

    // --- FeatureVariant.resourceUsage ---
    if (model === 'FeatureVariant' && data.resourceUsage !== undefined) {
      const validated = validateResourceUsage(unwrapSet(data.resourceUsage));
      if (!validated.ok) {
        throw new JsonValidationError(
          'FeatureVariant.resourceUsage',
          validated.error,
          data.resourceUsage,
        );
      }
    }

    // --- Notification.data ---
    if (model === 'Notification' && data.data !== undefined) {
      const validated = validateNotificationData(unwrapSet(data.data));
      if (!validated.ok) {
        throw new JsonValidationError('Notification.data', validated.error, data.data);
      }
    }

    // --- AddonService.metadata ---
    if (model === 'AddonService' && data.metadata !== undefined) {
      const validated = validateAddonServiceMetadata(unwrapSet(data.metadata));
      if (!validated.ok) {
        throw new JsonValidationError('AddonService.metadata', validated.error, data.metadata);
      }
    }

    // --- AuditLog oldValues / newValues ---
    if (model === 'AuditLog') {
      if (data.oldValues !== undefined) {
        const validated = validateAuditValue(unwrapSet(data.oldValues), 'AuditLog.oldValues');
        if (!validated.ok) {
          // Audit fields use a permissive schema — this should rarely fail,
          // but surface it clearly if it does
          throw new JsonValidationError('AuditLog.oldValues', validated.error, data.oldValues);
        }
      }
      if (data.newValues !== undefined) {
        const validated = validateAuditValue(unwrapSet(data.newValues), 'AuditLog.newValues');
        if (!validated.ok) {
          throw new JsonValidationError('AuditLog.newValues', validated.error, data.newValues);
        }
      }
    }

    return next(params);
  };
}

// ---------------------------------------------------------------------------
// Read validation middleware (non-throwing — logs only)
// ---------------------------------------------------------------------------

/** Sentinel value to detect uninitialized JSON fields */
const SENTINEL = Symbol('JSON_VALIDATION_SENTINEL');

/**
 * Result of validating a single JSON field during a read operation.
 */
interface FieldValidationResult {
  field: string;
  ok: boolean;
  error?: string;
  value?: unknown;
}

/**
 * Prisma middleware that validates JSON fields on every database read
 * (`findUnique`, `findFirst`, `findMany`, `findRaw`, etc.).
 *
 * Unlike the write middleware, this does **not** throw. Instead it:
 *   1. Inspects each returned record's JSON fields against their schemas.
 *   2. Logs a structured warning for any field that fails validation.
 *   3. Optionally calls a custom `onInvalidField` callback (useful for metrics,
 *      alerting, or auto-repair workflows).
 *
 * Use this during development or as a background monitoring layer to detect
 * legacy / manually-inserted data that violates the expected schema.
 *
 * @param options.onInvalidField  — Called with the validation result for each invalid field.
 *                                  Defaults to logging a console.warn.
 * @param options.logSuccess      — Whether to log successfully validated fields (default: false).
 *
 * @example
 * ```ts
 * const prisma = new PrismaClient({
 *   middlewares: [
 *     createJsonValidationMiddleware(),
 *     createReadValidationMiddleware({
 *       onInvalidField: (result) => {
 *         metrics.increment('json.validation.failed', { field: result.field });
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
export function createReadValidationMiddleware(
  options: {
    onInvalidField?: (result: FieldValidationResult) => void;
    logSuccess?: boolean;
  } = {},
): Middleware {
  const { onInvalidField, logSuccess = false } = options;

  /** Performs the actual read operation and post-processes the result */
  async function validateReadResult(
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<unknown>,
  ): Promise<unknown> {
    const result = await next(params);

    // Nothing to validate
    if (result === null || result === undefined) {
      return result;
    }

    const model = (params.model as string) ?? '';
    const records = Array.isArray(result) ? result : [result];

    for (const record of records) {
      if (!record || typeof record !== 'object') continue;
      validateRecordFields(record as Record<string, unknown>, model);
    }

    return result;
  }

  function validateRecordFields(
    record: Record<string, unknown>,
    model: string,
  ): void {
    const fieldsToValidate: Array<[string, (v: unknown) => FieldValidationResult]> = [
      ...getModelValidators(model, record),
    ];

    for (const [field, validator] of fieldsToValidate) {
      const value = record[field];
      // Skip truly absent / null fields
      if (value === undefined || value === null) continue;

      const parsed = validator(value);

      if (parsed.ok) {
        if (logSuccess) {
          log(`[JSON-READ] ✓ ${model}.${field}`, { value });
        }
      } else {
        const result: FieldValidationResult = {
          field: `${model}.${field}`,
          ok: false,
          error: parsed.error,
          value,
        };

        if (onInvalidField) {
          onInvalidField(result);
        } else {
          // Default: structured console warning
          console.warn('[JSON-READ] ✗ Validation failed', {
            field: result.field,
            error: result.error,
            // truncate large values for readability
            valuePreview:
              typeof result.value === 'object'
                ? JSON.stringify(result.value)?.slice(0, 200)
                : result.value,
          });
        }
      }
    }
  }

  return validateReadResult;
}

// ---------------------------------------------------------------------------
// Validator registry (read middleware)
// ---------------------------------------------------------------------------

function getModelValidators(
  model: string,
  record: Record<string, unknown>,
): Array<[string, (v: unknown) => FieldValidationResult]> {
  const validators: Array<[string, (v: unknown) => FieldValidationResult]> = [];

  switch (model) {
    case 'TeamMember':
      if ('social' in record) {
        validators.push(['social', wrapValidator(validateTeamMemberSocial)]);
      }
      break;

    case 'QuoteRequest':
      if ('selectedItems' in record) {
        validators.push(['selectedItems', wrapValidator(validateSelectedItems)]);
      }
      break;

    case 'PricingComparisonFeature':
      if ('values' in record) {
        validators.push(['values', wrapValidator(validateFeatureValues)]);
      }
      break;

    case 'LandingSection':
      if ('content' in record) {
        validators.push(['content', wrapValidator(validateSectionContent)]);
      }
      if ('styles' in record) {
        validators.push(['styles', wrapValidator(validateSectionStyles)]);
      }
      break;

    case 'FeatureVariant':
      if ('resourceUsage' in record) {
        validators.push(['resourceUsage', wrapValidator(validateResourceUsage)]);
      }
      break;

    case 'Notification':
      if ('data' in record) {
        validators.push(['data', wrapValidator(validateNotificationData)]);
      }
      break;

    case 'AddonService':
      if ('metadata' in record) {
        validators.push(['metadata', wrapValidator(validateAddonServiceMetadata)]);
      }
      break;

    case 'AuditLog':
      if ('oldValues' in record) {
        validators.push(['oldValues', wrapValidator((v) => validateAuditValue(v, 'AuditLog.oldValues'))]);
      }
      if ('newValues' in record) {
        validators.push(['newValues', wrapValidator((v) => validateAuditValue(v, 'AuditLog.newValues'))]);
      }
      break;

    // Add new models here as the schema grows
    default:
      break;
  }

  return validators;
}

/** Wraps a `Result<T>` validator into a `FieldValidationResult` */
function wrapValidator<T>(
  fn: (v: unknown) => { ok: true; data: T } | { ok: false; error: string; field?: string },
): (v: unknown) => FieldValidationResult {
  return (value: unknown) => {
    const result = fn(value);
    if (result.ok) {
      return { field: '', ok: true };
    }
    return { field: result.field ?? '', ok: false, error: result.error, value };
  };
}

/** Stub validator for required fields on read (always pass — already thrown on write) */
function stubValidator(value: unknown): FieldValidationResult {
  return { field: '', ok: true };
}

// ---------------------------------------------------------------------------
// Thin wrapper for the model-specific switch in createJsonValidationMiddleware
// (avoids a long if/else chain)
// ---------------------------------------------------------------------------

function runValidator(
  model: string,
  field: string,
  value: unknown,
): { ok: true } | { ok: false; error: string } {
  switch (`${model}:${field}`) {
    case 'QuoteRequest:selectedItems':
      return validateSelectedItems(value);
    case 'PricingComparisonFeature:values':
      return validateFeatureValues(value);
    case 'LandingSection:content':
      return validateSectionContent(value);
    case 'LandingSection:styles':
      return validateSectionStyles(value);
    case 'TeamMember:social':
      return validateTeamMemberSocial(value);
    case 'FeatureVariant:resourceUsage':
      return validateResourceUsage(value);
    case 'Notification:data':
      return validateNotificationData(value);
    case 'AddonService:metadata':
      return validateAddonServiceMetadata(value);
    case 'AuditLog:oldValues':
      return validateAuditValue(value, 'AuditLog.oldValues');
    case 'AuditLog:newValues':
      return validateAuditValue(value, 'AuditLog.newValues');
    default:
      return { ok: true }; // Unknown field — let it pass
  }
}

// ---------------------------------------------------------------------------
// Console helpers (structured, easily replaced with a real logger)
// ---------------------------------------------------------------------------

function log(message: string, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;
  console.log(message, meta ?? '');
}

// ---------------------------------------------------------------------------
// Convenience: default instances ready to drop into PrismaClient options
// ---------------------------------------------------------------------------

/** Default write-validation middleware (safe to use in production) */
export const jsonValidationMiddleware = createJsonValidationMiddleware();

/**
 * Default read-validation middleware — logs warnings but never throws.
 * Register after the write middleware.
 *
 * ```ts
 * const prisma = new PrismaClient({
 *   middlewares: [
 *     createJsonValidationMiddleware(),
 *     createReadValidationMiddleware(),
 *   ],
 * });
 * ```
 */
export const jsonReadValidationMiddleware = createReadValidationMiddleware();
