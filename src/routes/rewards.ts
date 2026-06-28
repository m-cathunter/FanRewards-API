import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { RewardService } from '../services/RewardService';
import { getUserId } from '../middleware/auth';
import { paginated, success } from '../utils/response';

const IdParams = Type.Object({ id: Type.String({ format: 'uuid' }) });

const HistoryQuery = Type.Object(
  {
    page: Type.Integer({ minimum: 1, default: 1 }),
    limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
  },
  { additionalProperties: false },
);

const tags = ['rewards'];
const security = [{ bearerAuth: [] }];

export default async function rewardRoutes(fastify: FastifyInstance) {
  const rewards = new RewardService(fastify.dataSource);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get(
    '/',
    { schema: { tags, security, summary: 'List available rewards' } },
    async () => {
      return success(await rewards.list());
    },
  );

  fastify.get<{ Querystring: Static<typeof HistoryQuery> }>(
    '/history',
    { schema: { tags, security, summary: 'Redemption history', querystring: HistoryQuery } },
    async (request) => {
      const { page, limit } = request.query;
      const { rows, total } = await rewards.getHistory(getUserId(request), { page, limit });
      return paginated(rows, total, { page, limit });
    },
  );

  fastify.post<{ Params: Static<typeof IdParams> }>(
    '/:id/redeem',
    { schema: { tags, security, summary: 'Redeem a reward', params: IdParams } },
    async (request, reply) => {
      const result = await rewards.redeem(getUserId(request), request.params.id);
      reply.code(201);
      return success(result);
    },
  );
}
