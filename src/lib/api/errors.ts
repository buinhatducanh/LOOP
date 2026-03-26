/**
 * Standardized API error classes.
 *
 * Usage:
 *   import { ApiError } from "@/lib/api/errors"
 *   throw new ApiError(400, "Invalid ID", "INVALID_ID")
 *
 * Catch in route handler:
 *   import { handleError } from "@/lib/api"
 *   } catch (err) { return handleError(err) }
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Factory helpers for common errors ───────────────────────────────────────

export function badRequestError(message: string, code?: string): ApiError {
  return new ApiError(400, message, code);
}

export function unauthorizedError(message = "Unauthorized", code?: string): ApiError {
  return new ApiError(401, message, code);
}

export function forbiddenError(message = "Forbidden", code?: string): ApiError {
  return new ApiError(403, message, code);
}

export function notFoundError(resource = "Resource", code?: string): ApiError {
  return new ApiError(404, `${resource} not found`, code ?? "NOT_FOUND");
}

export function conflictError(message: string, code?: string): ApiError {
  return new ApiError(409, message, code);
}

export function unprocessableError(message: string, code?: string): ApiError {
  return new ApiError(422, message, code);
}

export function serverError(message = "Internal server error", code?: string): ApiError {
  return new ApiError(500, message, code);
}

export function serviceUnavailableError(message = "Service unavailable", code?: string): ApiError {
  return new ApiError(503, message, code);
}
