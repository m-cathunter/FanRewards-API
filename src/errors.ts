/**
 * Typed application errors. Every error thrown deliberately by the service or
 * route layer is an AppError carrying an HTTP status and a stable machine
 * readable code, so the centralized error handler can render a consistent
 * envelope without guessing.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'CONFLICT'
  | 'INSUFFICIENT_POINTS'
  | 'REWARD_UNAVAILABLE'
  | 'CHALLENGE_INACTIVE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(code: ErrorCode, message: string): AppError {
    return new AppError(400, code, message);
  }

  static unauthorized(message = 'Authentication required', code: ErrorCode = 'UNAUTHORIZED'): AppError {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'You do not have access to this resource'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(code: ErrorCode, message: string): AppError {
    return new AppError(409, code, message);
  }
}
