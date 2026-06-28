import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { QueryFailedError } from 'typeorm';
import { AppError, ErrorCode } from '../errors';

/**
 * Centralized error handling. Translates every error into the standard
 * `{ error: { code, message } }` envelope so clients get a predictable shape
 * regardless of where the failure originated:
 *  - AppError        -> its own status + code
 *  - schema failures -> 400 VALIDATION_ERROR
 *  - unique-violation-> 409 CONFLICT
 *  - everything else -> 500 INTERNAL_ERROR (details logged, not leaked)
 */
async function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    // Fastify JSON-schema validation failures.
    if (error.validation) {
      reply.code(400).send({
        error: { code: 'VALIDATION_ERROR' as ErrorCode, message: error.message },
      });
      return;
    }

    // Postgres unique-constraint violations surface as a conflict.
    if (error instanceof QueryFailedError && (error as any).code === '23505') {
      reply.code(409).send({
        error: { code: 'CONFLICT' as ErrorCode, message: 'Resource already exists' },
      });
      return;
    }

    // Plugins (e.g. rate-limit) set their own statusCode but no AppError.
    if (typeof error.statusCode === 'number' && error.statusCode < 500) {
      reply.code(error.statusCode).send({
        error: { code: 'VALIDATION_ERROR' as ErrorCode, message: error.message },
      });
      return;
    }

    request.log.error(error);
    reply.code(500).send({
      error: { code: 'INTERNAL_ERROR' as ErrorCode, message: 'An unexpected error occurred' },
    });
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND' as ErrorCode,
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });
}

export default fp(errorHandler, { name: 'error-handler' });
