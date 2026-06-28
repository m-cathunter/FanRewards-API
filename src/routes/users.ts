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

export default async function userRoutes(fastify: FastifyInstance) {
  const users = new UserService(fastify.dataSource);

  // All user routes require a valid access token.
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/me', async (request) => {
    return success(await users.getProfile(getUserId(request)));
  });

  fastify.patch<{ Body: Static<typeof UpdateProfileBody> }>(
    '/me',
    { schema: { body: UpdateProfileBody } },
    async (request) => {
      return success(await users.updateProfile(getUserId(request), request.body.displayName));
    },
  );

  fastify.get('/me/stats', async (request) => {
    return success(await users.getStats(getUserId(request)));
  });
}
