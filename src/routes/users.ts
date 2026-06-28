import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { UserService } from '../services/UserService';
import { getUserId } from '../middleware/auth';
import { success } from '../utils/response';

const UpdateProfileBody = Type.Object(
  {
    displayName: Type.Union([Type.String({ minLength: 1, maxLength: 100 }), Type.Null()]),
  },
  { additionalProperties: false },
);

const tags = ['users'];
const security = [{ bearerAuth: [] }];

export default async function userRoutes(fastify: FastifyInstance) {
  const users = new UserService(fastify.dataSource);

  // All user routes require a valid access token.
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get(
    '/me',
    { schema: { tags, security, summary: 'Get the current user profile' } },
    async (request) => {
      return success(await users.getProfile(getUserId(request)));
    },
  );

  fastify.patch<{ Body: Static<typeof UpdateProfileBody> }>(
    '/me',
    { schema: { tags, security, summary: 'Update the current user profile', body: UpdateProfileBody } },
    async (request) => {
      return success(await users.updateProfile(getUserId(request), request.body.displayName));
    },
  );

  fastify.get(
    '/me/stats',
    { schema: { tags, security, summary: 'Points, completions and redemptions summary' } },
    async (request) => {
      return success(await users.getStats(getUserId(request)));
    },
  );
}
