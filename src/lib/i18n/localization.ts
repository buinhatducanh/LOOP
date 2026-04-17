/**
 * i18n Localization Helpers — LOOP Solutions
 *
 * Provides locale-aware field resolution with automatic VI fallback.
 * BE uses these helpers to return localized content based on `?lang=` param.
 *
 * Fallback chain: requested_locale → VI (source of truth) → null
 */

import type { Locale } from "@/i18n/routing";

// ─── Locale suffix map ─────────────────────────────────────────────────────────────
// Maps locale codes to their DB field suffix.
// VI (default) has no suffix — primary fields (title, description, etc.) are VI.

const LOCALE_SUFFIX: Record<Locale | string, string> = {
  vi: "",
  en: "En",
  ja: "Ja",
  ko: "Ko",
  zh: "Zh",
};

// Priority fallback chain: requested → VI (default)
const _FALLBACK_CHAIN: Locale[] = ["vi", "en"];

type LocalizedRecord = Record<string, unknown>;

/**
 * Get a localized field value from a record with locale-suffixed fields.
 *
 * @param record - DB record with fields like { title, titleEn, titleJa, ... }
 * @param fieldName - Base field name without locale suffix (e.g., "title")
 * @param locale - Current request locale
 * @returns Localized value, falling back through the chain (en → vi)
 *
 * @example
 * const service = await prisma.service.findFirst();
 * return getLocalizedField(service, "title", "en");
 * // Returns service.titleEn if not null, else service.title (VI fallback)
 */
export function getLocalizedField<T extends LocalizedRecord>(
  record: T,
  fieldName: string,
  locale: Locale | string
): string | null {
  const suffix = LOCALE_SUFFIX[locale] ?? "";

  // Build the suffixed field name
  const localizedKey = suffix ? `${fieldName}${suffix}` : fieldName;

  // Try the requested locale first
  const localizedValue = record[localizedKey] as string | null | undefined;
  if (localizedValue != null && localizedValue !== "") {
    return localizedValue;
  }

  // Fallback to VI (source of truth) if not already VI
  if (locale !== "vi") {
    const viValue = record[fieldName] as string | null | undefined;
    if (viValue != null && viValue !== "") {
      return viValue;
    }
  }

  return null;
}

/**
 * Get a localized string array field (e.g., features, technologies).
 * Falls back to VI if the localized array is empty or undefined.
 *
 * @example
 * const project = await prisma.project.findFirst();
 * return getLocalizedArray(project, "techStack", "en");
 */
export function getLocalizedArray<T extends LocalizedRecord>(
  record: T,
  fieldName: string,
  locale: Locale | string
): string[] {
  const suffix = LOCALE_SUFFIX[locale] ?? "";
  const localizedKey = suffix ? `${fieldName}${suffix}` : fieldName;

  const localizedValue = record[localizedKey] as string[] | null | undefined;
  if (Array.isArray(localizedValue) && localizedValue.length > 0) {
    return localizedValue;
  }

  if (locale !== "vi") {
    const viValue = record[fieldName] as string[] | null | undefined;
    if (Array.isArray(viValue) && viValue.length > 0) {
      return viValue;
    }
  }

  return [];
}

/**
 * Get all localized fields from a record for a given locale.
 * Returns an object with both the localized values and a `locale` metadata field.
 *
 * Useful for API responses where you want to know which locale was used.
 *
 * @example
 * const project = await prisma.project.findFirst();
 * const result = getAllLocalizedFields(project, ["title", "description"], "en");
 * // result = { title: "Project Title", description: "...", _localeUsed: "en" }
 */
export function getAllLocalizedFields<T extends LocalizedRecord>(
  record: T,
  fieldNames: string[],
  locale: Locale | string
): Record<string, string | string[] | null> & { _localeUsed: string } {
  const result: Record<string, string | string[] | null> = { _localeUsed: locale };

  for (const fieldName of fieldNames) {
    const value = record[`${fieldName}${LOCALE_SUFFIX[locale] ?? ""}`] as string | string[] | null | undefined;
    if (value != null && value !== "") {
      result[fieldName] = value;
    } else if (locale !== "vi") {
      // Fallback to VI
      const viValue = record[fieldName] as string | string[] | null | undefined;
      result[fieldName] = viValue ?? null;
    } else {
      result[fieldName] = null;
    }
  }

  return result as Record<string, string | string[] | null> & { _localeUsed: string };
}

/**
 * Map a Prisma result to a localized public-facing shape.
 * Strips internal/admin fields and returns only public content.
 *
 * @example
 * const services = await prisma.service.findMany({ where: { isActive: true } });
 * return services.map(s => mapLocalizedService(s, "en"));
 */
export function mapLocalizedService<T extends LocalizedRecord>(
  record: T,
  locale: Locale | string
): Record<string, unknown> & { _localeUsed: string } {
  return {
    id: record["id"],
    slug: record["slug"],
    icon: record["icon"],
    title: getLocalizedField(record, "title", locale),
    shortDescription: getLocalizedField(record, "shortDescription", locale),
    longDescription: getLocalizedField(record, "longDescription", locale),
    features: getLocalizedArray(record, "features", locale),
    technologies: getLocalizedArray(record, "technologies", locale),
    startingPrice: record["startingPrice"] ?? record["starting_price"],
    deliveryTime: record["deliveryTime"] ?? record["delivery_time"],
    category: record["category"],
    isActive: record["isActive"] ?? record["is_active"],
    sortOrder: record["sortOrder"] ?? record["sort_order"],
    createdAt: record["createdAt"] ?? record["created_at"],
    updatedAt: record["updatedAt"] ?? record["updated_at"],
    _localeUsed: locale,
  };
}

export function mapLocalizedProject<T extends LocalizedRecord>(
  record: T,
  locale: Locale | string
): Record<string, unknown> & { _localeUsed: string } {
  return {
    id: record["id"],
    slug: record["slug"],
    title: getLocalizedField(record, "title", locale),
    category: record["category"],
    client: record["client"],
    year: record["year"],
    image: record["image"],
    description: getLocalizedField(record, "description", locale),
    techStack: getLocalizedArray(record, "techStack", locale),
    features: getLocalizedArray(record, "features", locale),
    results: getLocalizedField(record, "results", locale),
    screenshots: record["screenshots"] ?? record["screenshots"],
    isPublished: record["isPublished"] ?? record["is_published"],
    sortOrder: record["sortOrder"] ?? record["sort_order"],
    createdAt: record["createdAt"] ?? record["created_at"],
    updatedAt: record["updatedAt"] ?? record["updated_at"],
    _localeUsed: locale,
  };
}

export function mapLocalizedTeamMember<T extends LocalizedRecord>(
  record: T,
  locale: Locale | string
): Record<string, unknown> & { _localeUsed: string } {
  return {
    id: record["id"],
    slug: record["slug"],
    name: getLocalizedField(record, "name", locale),
    role: getLocalizedField(record, "role", locale),
    bio: getLocalizedField(record, "bio", locale),
    shortBio: getLocalizedField(record, "shortBio", locale),
    image: record["image"],
    coverImage: record["coverImage"] ?? record["cover_image"],
    achievements: record["achievements"] ?? record["achievements"],
    linkedin: record["linkedin"],
    twitter: record["twitter"],
    github: record["github"],
    facebook: record["facebook"],
    tiktok: record["tiktok"],
    sortOrder: record["sortOrder"] ?? record["sort_order"],
    isActive: record["isActive"] ?? record["is_active"],
    isFeatured: record["isFeatured"] ?? record["is_featured"],
    isWorking: record["isWorking"] ?? record["is_working"],
    // ── Guild / Gamification fields ───────────────────────────────
    level: record["level"] ?? 1,
    currentXp: record["currentXp"] ?? record["current_xp"] ?? 0,
    maxXp: record["maxXp"] ?? record["max_xp"] ?? 100,
    rank: record["rank"] ?? "iron",
    availableLp: record["availableLp"] ?? record["available_lp"] ?? 0,
    lockedLp: record["lockedLp"] ?? record["locked_lp"] ?? 0,
    // ── Department / RBAC ──────────────────────────────────────
    department: record["department"],
    departmentId: record["departmentId"] ?? record["department_id"],
    isDeptHead: record["isDeptHead"] ?? record["is_dept_head"],
    tabPermissions: record["tabPermissions"] ?? record["tab_permissions"],
    accessTags: record["accessTags"] ?? record["access_tags"],
    requestStatus: record["requestStatus"] ?? record["request_status"],
    // ── Commission / Sales ───────────────────────────────────────
    totalSalesCommission: record["totalSalesCommission"] ?? record["total_sales_commission"] ?? 0,
    pendingCommission: record["pendingCommission"] ?? record["pending_commission"] ?? 0,
    completedCommission: record["completedCommission"] ?? record["completed_commission"] ?? 0,
    // ── Contact / Personal ──────────────────────────────────────
    email: record["email"],
    phone: record["phone"],
    birthDate: record["birthDate"] ?? record["birth_date"],
    address: record["address"],
    cccd: record["cccd"],
    // ── Career / Work ────────────────────────────────────────────
    joinedDate: record["joinedDate"] ?? record["joined_date"],
    contractStart: record["contractStart"] ?? record["contract_start"],
    experienceFrom: record["experienceFrom"] ?? record["experience_from"],
    experience: record["experience"],
    quote: record["quote"],
    // ── Banking (off-system LP split) ────────────────────────────
    bankName: record["bankName"],
    bankAccount: record["bankAccount"],
    bankAccountName: record["bankAccountName"],
    // ── Skills / Expertise ────────────────────────────────────────
    skills: record["skills"] ?? record["Skills"] ?? [],
    // ── Legacy / deprecated ──────────────────────────────────────
    team: record["team"] ?? "Alpha",
    roleCode: record["roleCode"] ?? record["role_code"] ?? "BOW",
    specialty: getLocalizedField(record, "specialty", locale),
    createdAt: record["createdAt"] ?? record["created_at"],
    updatedAt: record["updatedAt"] ?? record["updated_at"],
    _localeUsed: locale,
  };
}

export function mapLocalizedBlogPost<T extends LocalizedRecord>(
  record: T,
  locale: Locale | string
): Record<string, unknown> & { _localeUsed: string } {
  return {
    id: record["id"],
    slug: record["slug"],
    title: getLocalizedField(record, "title", locale),
    content: getLocalizedField(record, "content", locale),
    excerpt: getLocalizedField(record, "excerpt", locale),
    coverImage: record["coverImage"] ?? record["cover_image"],
    seoTitle: getLocalizedField(record, "seoTitle", locale),
    seoDesc: getLocalizedField(record, "seoDesc", locale),
    status: record["status"],
    publishedAt: record["publishedAt"] ?? record["published_at"],
    createdAt: record["createdAt"] ?? record["created_at"],
    updatedAt: record["updatedAt"] ?? record["updated_at"],
    _localeUsed: locale,
  };
}

/**
 * Parse the `lang` query param from a URLSearchParams object.
 * Returns "vi" (default) for invalid or missing values.
 */
export function parseLocaleParam(searchParams: URLSearchParams): Locale {
  const lang = searchParams.get("lang");
  if (lang && LOCALE_SUFFIX[lang] !== undefined) {
    return lang as Locale;
  }
  return "vi";
}
