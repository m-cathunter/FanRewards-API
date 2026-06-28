import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../errors';

interface AccessPayload {
  sub: string;
  type: 'access';
}

/**
 * Auth guard: verifies the Bearer access token and attaches the user id to the
 * request. Used as an onRequest hook on protected routes. Throwing an AppError
 * lets the centralized handler render the 401 envelope.
 */
export async function authGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as AccessPayload;
    if (payload.type !== 'access') {
      throw new Error('wrong token type');
    }
    request.user = { userId: payload.sub };
  } catch {
    throw AppError.unauthorized('Invalid or expired access token', 'INVALID_TOKEN');
  }
}

/** Read the authenticated user id, asserting the guard has run. */
export function getUserId(request: FastifyRequest): string {
  if (!request.user) {
    throw AppError.unauthorized();
  }
  return request.user.userId;
}

/** Decorate the instance with `authenticate` so routes can use it as a hook. */
async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate('authenticate', authGuard);
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authGuard;
  }
}

export default fp(authPlugin, { name: 'auth' });
