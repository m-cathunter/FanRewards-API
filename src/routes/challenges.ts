import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { ChallengeService } from '../services/ChallengeService';
import { getUserId } from '../middleware/auth';
import { paginated, success } from '../utils/response';

const ListQuery = Type.Object(
  {
    page: Type.Integer({ minimum: 1, default: 1 }),
    limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    difficulty: Type.Optional(
      Type.Union([Type.Literal('easy'), Type.Literal('medium'), Type.Literal('hard')]),
    ),
    active: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

const IdParams = Type.Object({ id: Type.String({ format: 'uuid' }) });

const CompleteBody = Type.Object(
  { listenPercentage: Type.Integer({ minimum: 0, maximum: 100 }) },
  { additionalProperties: false },
);

export default async function challengeRoutes(fastify: FastifyInstance) {
  const challenges = new ChallengeService(fastify.dataSource);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Querystring: Static<typeof ListQuery> }>(
    '/',
    { schema: { querystring: ListQuery } },
    async (request) => {
      const { page, limit, difficulty, active } = request.query;
      const { rows, total } = await challenges.list({ page, limit, difficulty, active });
      return paginated(rows, total, { page, limit });
    },
  );

  fastify.get<{ Params: Static<typeof IdParams> }>(
    '/:id',
    { schema: { params: IdParams } },
    async (request) => {
      return success(await challenges.getById(request.params.id));
    },
  );

  fastify.post<{ Params: Static<typeof IdParams>; Body: Static<typeof CompleteBody> }>(
    '/:id/complete',
    { schema: { params: IdParams, body: CompleteBody } },
    async (request, reply) => {
      const result = await challenges.complete(
        getUserId(request),
        request.params.id,
        request.body.listenPercentage,
      );
      reply.code(201);
      return success(result);
    },
  );
}
