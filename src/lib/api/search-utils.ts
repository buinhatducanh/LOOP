/**
 * Unified search/filter utility — parses query params into Prisma where clauses.
 * Designed to work consistently across all admin API routes.
 */

export type FilterOperator =
  | "contains"       // case-insensitive substring
  | "equals"          // exact match
  | "in"              // array membership
  | "gte"             // greater than or equal (for dates/numbers)
  | "lte"             // less than or equal (for dates/numbers)
  | "boolean";        // boolean equality

export interface SearchField {
  /** Prisma field name */
  field: string;
  /** How to match — defaults to "contains" for text fields */
  operator?: FilterOperator;
  /** For "in" operator — list of valid values */
  values?: string[];
}

export interface EntityFilterConfig {
  /** Fields searched when `search` param is present (OR'd together) */
  searchFields?: SearchField[];
  /** Fields that accept direct equality filter via ?field=value */
  eqFields?: string[];
  /** Date/datetime fields that accept ?fieldFrom= & ?fieldTo= range */
  dateFields?: string[];
  /** Boolean fields that accept ?field=true|false */
  boolFields?: string[];
  /** Enum/set fields that accept ?field=value with allowed values check */
  enumFields?: Record<string, string[]>;
  /** Default sort field */
  defaultSort?: { field: string; dir: "asc" | "desc" };
}

const DEFAULT_TEXT_OPERATOR = "contains" as const;

// ─── Core builder ──────────────────────────────────────────────────────────

/**
 * Build a Prisma-compatible `where` clause + `orderBy` from request searchParams.
 *
 * @param params   Parsed URL searchParams
 * @param config   Per-entity filter configuration
 * @returns        { where, orderBy }
 */
export function buildQueryFromParams(
  params: URLSearchParams,
  config: EntityFilterConfig,
): { where: Record<string, unknown>; orderBy: Record<string, "asc" | "desc"> } {
  const where: Record<string, unknown> = {};
  const search = params.get("search")?.trim() ?? "";
  const _page = parseInt(params.get("page") ?? "1", 10);
  const _limit = parseInt(params.get("limit") ?? "20", 10);

  // ── Text search (OR across configured fields) ──────────────────────────
  if (search && config.searchFields && config.searchFields.length > 0) {
    where.OR = config.searchFields.map(({ field, operator }) => {
      const op = operator ?? DEFAULT_TEXT_OPERATOR;
      if (op === "contains") {
        return { [field]: { contains: search, mode: "insensitive" } };
      }
      if (op === "equals") {
        return { [field]: { equals: search, mode: "insensitive" } };
      }
      return { [field]: { [op]: search } };
    });
  }

  // ── Date range filters ─────────────────────────────────────────────────
  if (config.dateFields) {
    for (const field of config.dateFields) {
      const from = params.get(`${field}From`);
      const to = params.get(`${field}To`);
      if (from || to) {
        where[field] = {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
        };
      }
    }
  }

  // ── Boolean filters ─────────────────────────────────────────────────────
  if (config.boolFields) {
    for (const field of config.boolFields) {
      const val = params.get(field);
      if (val === "true") where[field] = true;
      else if (val === "false") where[field] = false;
    }
  }

  // ── Enum / equality filters ────────────────────────────────────────────
  if (config.enumFields) {
    for (const [field, allowed] of Object.entries(config.enumFields)) {
      const val = params.get(field);
      if (val && allowed.includes(val)) {
        where[field] = val;
      }
    }
  }

  // ── Generic eqFields (any ?field=value not covered above) ───────────────
  if (config.eqFields) {
    for (const field of config.eqFields) {
      const val = params.get(field);
      if (val) where[field] = val;
    }
  }

  // ── Sort ────────────────────────────────────────────────────────────────
  const sortBy = params.get("sortBy") ?? config.defaultSort?.field ?? "createdAt";
  const sortDir = (params.get("sortDir") ?? config.defaultSort?.dir ?? "desc") as "asc" | "desc";
  const orderBy: Record<string, "asc" | "desc"> = { [sortBy]: sortDir };

  return { where, orderBy };
}

// ─── Pagination helpers ────────────────────────────────────────────────────

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
}

export function parsePagination(params: URLSearchParams): {
  pagination: PaginationResult;
  page: number;
  limit: number;
} {
  const _page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const _limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "20", 10)));
  return {
    pagination: { page: _page, limit: _limit, skip: (_page - 1) * _limit, totalPages: 0 },
    page: _page,
    limit: _limit,
  };
}

export function buildPaginationResponse(total: number, page: number, limit: number) {
  return {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Pre-built configs for common entities ─────────────────────────────────

export const ORDER_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "customerName", operator: "contains" },
    { field: "customerEmail", operator: "contains" },
    { field: "orderNumber", operator: "contains" },
  ],
  enumFields: {
    status: [
      "draft", "pending", "quoted", "accepted",
      "paid_partial", "paid_full", "contracted",
      "designing", "developing", "reviewing", "delivered",
      "completed", "cancelled",
    ],
    paymentStatus: ["unpaid", "paid_partial", "paid_full", "refunded"],
    orderType: ["package", "template", "custom"],
  },
  dateFields: ["createdAt"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const USER_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "email", operator: "contains" },
  ],
  boolFields: ["isActive"],
  enumFields: {
    accountType: ["staff", "customer"],
  },
  dateFields: ["createdAt"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const PROJECT_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "title", operator: "contains" },
    { field: "client", operator: "contains" },
    { field: "category", operator: "contains" },
  ],
  boolFields: ["isPublished"],
  dateFields: ["createdAt"],
  eqFields: ["serviceId"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const SERVICE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "title", operator: "contains" },
    { field: "slug", operator: "contains" },
    { field: "category", operator: "contains" },
  ],
  boolFields: ["isActive"],
  eqFields: ["category"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const MESSAGE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "email", operator: "contains" },
    { field: "message", operator: "contains" },
  ],
  enumFields: {
    status: ["new", "read", "replied", "archived"],
  },
  dateFields: ["createdAt"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const QUOTE_REQUEST_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "customerName", operator: "contains" },
    { field: "customerEmail", operator: "contains" },
    { field: "companyName", operator: "contains" },
  ],
  enumFields: { status: ["new", "reviewed", "quoted", "accepted", "rejected"] },
  dateFields: ["createdAt"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const TEAM_MEMBER_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "role", operator: "contains" },
  ],
  boolFields: ["isActive", "isFeatured", "isWorking"],
  eqFields: ["roleLevel"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const TESTIMONIAL_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "company", operator: "contains" },
    { field: "text", operator: "contains" },
  ],
  boolFields: ["isActive"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const EXPERTISE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "nameVi", operator: "contains" },
    { field: "category", operator: "contains" },
    { field: "categoryVi", operator: "contains" },
  ],
  boolFields: ["isActive"],
  eqFields: ["category"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const WEB_TEMPLATE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "nameVi", operator: "contains" },
    { field: "category", operator: "contains" },
    { field: "categoryVi", operator: "contains" },
  ],
  boolFields: ["isActive", "highlighted"],
  eqFields: ["category", "level"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const SERVICE_ATTRIBUTE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "nameVi", operator: "contains" },
    { field: "category", operator: "contains" },
    { field: "categoryVi", operator: "contains" },
  ],
  boolFields: ["isActive", "isRequired"],
  eqFields: ["category", "tier"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const LANDING_PAGE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "slug", operator: "contains" },
  ],
  boolFields: ["isPublished", "isDefault"],
  eqFields: ["locale"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const PRICING_PACKAGE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "nameVi", operator: "contains" },
    { field: "tagline", operator: "contains" },
    { field: "taglineVi", operator: "contains" },
  ],
  boolFields: ["isActive", "highlighted"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const ADDON_SERVICE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "nameVi", operator: "contains" },
    { field: "description", operator: "contains" },
    { field: "descriptionVi", operator: "contains" },
  ],
  boolFields: ["isActive"],
  eqFields: ["type"],
  defaultSort: { field: "sortOrder", dir: "asc" },
};

export const REWARD_TIER_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [{ field: "name", operator: "contains" }, { field: "nameVi", operator: "contains" }],
  boolFields: ["isActive"],
  defaultSort: { field: "level", dir: "asc" },
};

export const AUDIT_LOG_FILTER_CONFIG: EntityFilterConfig = {
  eqFields: ["resource", "action"],
  dateFields: ["createdAt"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const CUSTOMER_WEBSITE_FILTER_CONFIG: EntityFilterConfig = {
  searchFields: [
    { field: "name", operator: "contains" },
    { field: "domain", operator: "contains" },
    { field: "customerName", operator: "contains" },
    { field: "customerEmail", operator: "contains" },
  ],
  enumFields: { status: ["active", "inactive", "suspended", "expired"] },
  boolFields: ["isMonitored"],
  dateFields: ["createdAt", "deployedAt", "expiresAt"],
  defaultSort: { field: "createdAt", dir: "desc" },
};

export const POINT_TRANSACTION_FILTER_CONFIG: EntityFilterConfig = {
  enumFields: { type: ["earn", "spend", "expire", "refund"], source: [] },
  dateFields: ["createdAt", "expiresAt"],
  defaultSort: { field: "createdAt", dir: "desc" },
};
