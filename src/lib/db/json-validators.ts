// =============================================================================
// Zod Schemas for all JSON fields in the Prisma schema
// =============================================================================

import { z } from 'zod';
import { Result, ok, err, jsonValidationErr } from './errors';

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

/** TeamMember.social — social media / website URLs */
export const TeamMemberSocialSchema = z
  .object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    github: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    website: z.string().url().optional(),
  })
  .strict();

/** FeatureVariant.resourceUsage — CPU, memory, storage quotas and usage */
export const ResourceUsageSchema = z
  .object({
    cpu: z.number().min(0).max(100).optional(),
    memory: z.number().min(0).max(100).optional(),
    storage: z.number().nonnegative().optional(),
    bandwidth: z.number().nonnegative().optional(),
    apiCalls: z.number().int().nonnegative().optional(),
    custom: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

/** QuoteRequest.selectedItems — line items selected in a quote request */
export const SelectedItemsSchema = z
  .array(
    z.object({
      id: z.string(),
      name: z.string(),
      nameVi: z.string().optional(),
      category: z.string().optional(),
      price: z.number().int().nonnegative(),
      quantity: z.number().int().min(1).default(1),
      type: z
        .enum(['feature', 'addon', 'hosting', 'domain', 'other'])
        .default('feature'),
    }),
  )
  .default([]);

/** PricingComparisonFeature.values — arbitrary key/value comparison data */
export const FeatureValuesSchema: z.ZodType<Record<string, string | boolean | number | null>> = z
  .record(
    z.string(),
    z.union([z.string(), z.boolean(), z.number(), z.null()]),
  )
  .default({});

/** LandingSection.content — section copy, CTAs, and feature items */
export const LandingSectionContentSchema = z
  .object({
    title: z.string().optional(),
    titleVi: z.string().optional(),
    subtitle: z.string().optional(),
    subtitleVi: z.string().optional(),
    body: z.string().optional(),
    bodyVi: z.string().optional(),
    ctaText: z.string().optional(),
    ctaTextVi: z.string().optional(),
    ctaLink: z.string().optional(),
    items: z
      .array(
        z.object({
          icon: z.string().optional(),
          title: z.string(),
          titleVi: z.string().optional(),
          description: z.string().optional(),
          descriptionVi: z.string().optional(),
        }),
      )
      .optional(),
  })
  .strict();

/** LandingSection.styles — CSS customisation for a landing section */
export const LandingSectionStylesSchema = z
  .object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    paddingTop: z.string().optional(),
    paddingBottom: z.string().optional(),
    maxWidth: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    customCss: z.string().optional(),
  })
  .strict();

/** Notification.data — flexible notification payload */
export const NotificationDataSchema = z
  .object({
    title: z.string().optional(),
    message: z.string().optional(),
    link: z.string().url().optional(),
    icon: z.string().optional(),
    actionLabel: z.string().optional(),
    actionUrl: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough(); // Allow extra fields beyond the known ones

/** AuditLog.oldValues / AuditLog.newValues — fully flexible audit payload */
export const AuditValueSchema = z.record(z.string(), z.unknown());

/** AddonService.metadata — version, tags, requirements, dependencies */
export const AddonServiceMetadataSchema = z
  .object({
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    dependencies: z.record(z.string(), z.string()).optional(),
  })
  .passthrough(); // Allow extra fields

// ---------------------------------------------------------------------------
// Generic validation helper
// ---------------------------------------------------------------------------

/**
 * Validates `data` against the provided Zod schema.
 *
 * @param schema   - A Zod schema to validate against
 * @param data     - The raw value to validate
 * @param fieldName - Human-readable name of the field (used in error message)
 * @returns Result containing the parsed data on success, or an error message on failure
 */
export function validateJson<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fieldName: string,
): Result<T> {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return ok(parsed.data as T);
  }

  const issues = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
      return `${issue.message}${path}`;
    })
    .join('; ');

  return jsonValidationErr(fieldName, `${fieldName} validation failed: ${issues}`, data);
}

// ---------------------------------------------------------------------------
// Domain-specific validation helpers
// ---------------------------------------------------------------------------

export function validateTeamMemberSocial(
  data: unknown,
): Result<z.infer<typeof TeamMemberSocialSchema>> {
  return validateJson(TeamMemberSocialSchema, data, 'TeamMember.social');
}

export function validateResourceUsage(
  data: unknown,
): Result<z.infer<typeof ResourceUsageSchema>> {
  return validateJson(ResourceUsageSchema, data, 'FeatureVariant.resourceUsage');
}

export function validateSelectedItems(
  data: unknown,
): Result<z.infer<typeof SelectedItemsSchema>> {
  return validateJson(SelectedItemsSchema, data, 'QuoteRequest.selectedItems');
}

export function validateFeatureValues(
  data: unknown,
): Result<z.infer<typeof FeatureValuesSchema>> {
  return validateJson(FeatureValuesSchema, data, 'PricingComparisonFeature.values');
}

export function validateSectionContent(
  data: unknown,
): Result<z.infer<typeof LandingSectionContentSchema>> {
  return validateJson(LandingSectionContentSchema, data, 'LandingSection.content');
}

export function validateSectionStyles(
  data: unknown,
): Result<z.infer<typeof LandingSectionStylesSchema>> {
  return validateJson(LandingSectionStylesSchema, data, 'LandingSection.styles');
}

export function validateNotificationData(
  data: unknown,
): Result<z.infer<typeof NotificationDataSchema>> {
  return validateJson(NotificationDataSchema, data, 'Notification.data');
}

export function validateAddonServiceMetadata(
  data: unknown,
): Result<z.infer<typeof AddonServiceMetadataSchema>> {
  return validateJson(AddonServiceMetadataSchema, data, 'AddonService.metadata');
}

export function validateAuditValue(
  data: unknown,
  fieldName: 'AuditLog.oldValues' | 'AuditLog.newValues',
): Result<z.infer<typeof AuditValueSchema>> {
  return validateJson(AuditValueSchema, data, fieldName);
}
