import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { AuthService } from '../services/AuthService';
import { success } from '../utils/response';

const RegisterBody = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 255 }),
    password: Type.String({ minLength: 8, maxLength: 128 }),
    displayName: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  },
  { additionalProperties: false },
);

const LoginBody = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 255 }),
    password: Type.String({ minLength: 1, maxLength: 128 }),
  },
  { additionalProperties: false },
);

const RefreshBody = Type.Object(
  { refreshToken: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
);

const tags = ['auth'];

export default async function authRoutes(fastify: FastifyInstance) {
  const auth = new AuthService(fastify.dataSource);

  fastify.post<{ Body: Static<typeof RegisterBody> }>(
    '/register',
    { schema: { tags, summary: 'Create an account', body: RegisterBody } },
    async (request, reply) => {
      const { email, password, displayName } = request.body;
      const result = await auth.register(email, password, displayName);
      reply.code(201);
      return success(result);
    },
  );

  fastify.post<{ Body: Static<typeof LoginBody> }>(
    '/login',
    { schema: { tags, summary: 'Log in and receive tokens', body: LoginBody } },
    async (request) => {
      const { email, password } = request.body;
      return success(await auth.login(email, password));
    },
  );

  fastify.post<{ Body: Static<typeof RefreshBody> }>(
    '/refresh',
    { schema: { tags, summary: 'Rotate the refresh token', body: RefreshBody } },
    async (request) => {
      return success(await auth.refresh(request.body.refreshToken));
    },
  );

  fastify.post<{ Body: Static<typeof RefreshBody> }>(
    '/logout',
    { schema: { tags, summary: 'Revoke a refresh token', body: RefreshBody } },
    async (request) => {
      await auth.logout(request.body.refreshToken);
      return success({ loggedOut: true });
    },
  );
}
