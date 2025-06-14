import { Result } from './result.ts'

export class BizError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: unknown,
  ) {
    super(message)
    this.name = 'BizError'
  }
}

export class BizValidationError extends BizError {
  constructor(message: string, status: number, response: unknown) {
    super(message, status, response)
    this.name = 'BizValidationError'
  }
}

export class BizResourceNotFoundError extends BizError {
  constructor(resource: string) {
    super(`Resource not found: ${resource}`, 404, {
      message: `${resource} not found`,
    })
    this.name = 'BizResourceNotFoundError'
  }
}

export class BizAuthenticationError extends BizError {
  constructor(message = 'Authentication failed') {
    super(message, 401, { message })
    this.name = 'BizAuthenticationError'
  }
}

export class BizPermissionError extends BizError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, { message })
    this.name = 'BizPermissionError'
  }
}

export class BizRateLimitError extends BizError {
  constructor(
    message = 'Rate limit exceeded',
    public readonly resetAt: Date,
  ) {
    super(message, 429, { message, reset_at: resetAt.toISOString() })
    this.name = 'BizRateLimitError'
  }
}

export class BizConflictError extends BizError {
  constructor(message: string) {
    super(message, 409, { message })
    this.name = 'BizConflictError'
  }
}

export class BizServerError extends BizError {
  constructor(message: string) {
    super(message, 500, { message })
    this.name = 'BizServerError'
  }
}

export class BizAiError extends BizError {
  constructor(message: string, response: unknown) {
    super(message, Result.AI_ERROR, response)
    this.name = 'BizAiError'
  }
}

export function isBizError(error: unknown): error is BizError {
  return error instanceof BizError
}

export function createBizError(status: number, response: { message?: string; [k: string]: any }): BizError {
  switch (status) {
    case 401:
      return new BizAuthenticationError(response?.message)
    case 403:
      return new BizPermissionError(response?.message)
    case 404:
      return new BizResourceNotFoundError(response?.message || 'Resource')
    case 409:
      return new BizConflictError(response?.message || 'Conflict occurred')
    case 422:
      return new BizValidationError(response?.message || 'Validation failed', status, response)
    case 429:
      return new BizRateLimitError(response?.message, new Date(response?.reset_at || Date.now() + 60000))
    case 500:
      return new BizServerError(response?.message ?? 'Internal server error')
    case Result.AI_ERROR:
    case Result.AI_AGENT_TOOL_ERROR:
    case Result.AI_CHAT_ERROR:
      return new BizAiError(response?.message || 'AI error', response)
    default:
      return new BizError(response?.message || 'Biz API error', status, response)
  }
}
