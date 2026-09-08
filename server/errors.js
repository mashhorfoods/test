/**
 * ERRORS — classified, so a caller can tell a mistake from an outage.
 *
 * Every failure that leaves the API carries a `code` from this list and a
 * message written for a person. A stack trace never does: in production it is
 * logged and the response says INTERNAL_ERROR, because a stack trace is a map
 * of the inside of the building.
 */

export const CODES = {
  VALIDATION_ERROR: 400,
  AUTHENTICATION_ERROR: 401,
  AUTHORIZATION_ERROR: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DEPENDENCY_ERROR: 422,
  AGENT_PERMISSION_ERROR: 403,
  INVALID_AGENT_OUTPUT: 422,
  TIMEOUT: 504,
  PROVIDER_ERROR: 502,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  constructor(code, message, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.code = CODES[code] ? code : 'INTERNAL_ERROR';
    this.status = CODES[this.code];
    this.detail = detail;
  }
}

export const fail = (code, message, detail = null) => new ApiError(code, message, detail);

/** Which failures are worth trying again, and which are a waste of an attempt. */
export const RETRYABLE = new Set(['TIMEOUT', 'PROVIDER_ERROR', 'RATE_LIMITED', 'INTERNAL_ERROR']);
export const isRetryable = (code) => RETRYABLE.has(code);

/** The body a client sees. Never the stack, never the detail in production. */
export function toResponse(err, { production = true } = {}) {
  if (err instanceof ApiError) {
    const body = { error: { code: err.code, message: err.message } };
    if (!production && err.detail) body.error.detail = err.detail;
    return { status: err.status, body };
  }
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something failed on our side. It has been logged.',
        ...(production ? {} : { detail: String(err && err.message) }),
      },
    },
  };
}
