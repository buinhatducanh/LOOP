// =============================================================================
// Result Type & Error Utilities
// =============================================================================

/** Tagged success result */
export type Ok<T> = {
  ok: true;
  data: T;
};

/** Tagged error result with optional field context */
export type Err = {
  ok: false;
  error: string;
  field?: string;
};

/** Discriminated union result type for safe error handling */
export type Result<T> = Ok<T> | Err;

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });

export const err = (error: string, field?: string): Err => ({
  ok: false,
  error,
  field,
});

// ---------------------------------------------------------------------------
// JsonValidationError
// ---------------------------------------------------------------------------

/**
 * Thrown by JSON validation middleware when a JSON field fails schema
 * validation before a database write is attempted.
 */
export class JsonValidationError extends Error {
  constructor(
    /** Dot-notation path to the field that failed, e.g. `"TeamMember.social"` */
    public field: string,
    message: string,
    /** The raw value that failed validation (attached for debugging) */
    public value?: unknown,
  ) {
    super(message);
    this.name = 'JsonValidationError';
    // Maintains proper stack trace in V8 environments (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JsonValidationError);
    }
  }
}

/**
 * Creates a JsonValidationError and returns it as a tagged Err so callers
 * can decide whether to throw or surface the error differently.
 */
export const jsonValidationErr = (
  field: string,
  message: string,
  value?: unknown,
): Err => ({ ok: false, error: message, field });

// ---------------------------------------------------------------------------
// TaggedError helpers (for extensible error typing)
// ---------------------------------------------------------------------------

/** Base brand type for tagged errors */
export type TaggedError<Tag extends string, T> = {
  readonly _tag: Tag;
} & T;

/**
 * Creates a discriminated-union tagged error object.
 * Usage: `createTaggedError<'ValidationError', { message: string }>()`
 */
export function createTaggedError<
  Tag extends string,
  T extends object,
>() {
  return (data: T) => ({ _tag: '' as Tag, ...data }) as TaggedError<Tag, T> & {
    _tag: Tag;
  };
}
