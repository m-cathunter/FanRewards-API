import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { LeaderboardService } from '../services/LeaderboardService';
import { getUserId } from '../middleware/auth';
import { paginated, success } from '../utils/response';

const ListQuery = Type.Object(
  {
    page: Type.Integer({ minimum: 1, default: 1 }),
    limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
  },
  { additionalProperties: false },
);

const tags = ['leaderboard'];
const security = [{ bearerAuth: [] }];

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  const leaderboard = new LeaderboardService(fastify.dataSource);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Querystring: Static<typeof ListQuery> }>(
    '/',
    { schema: { tags, security, summary: 'Top fans by points', querystring: ListQuery } },
    async (request) => {
      const { page, limit } = request.query;
      const { rows, total } = await leaderboard.getTopFans({ page, limit });
      return paginated(rows, total, { page, limit });
    },
  );

  fastify.get(
    '/me',
    { schema: { tags, security, summary: "The current user's rank" } },
    async (request) => {
      return success(await leaderboard.getUserRank(getUserId(request)));
    },
  );
}
