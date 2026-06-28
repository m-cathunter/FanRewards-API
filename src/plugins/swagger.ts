import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

/**
 * OpenAPI docs generated from the route JSON schemas. Registered before the
 * route plugins so it can collect their schemas. UI is served at /docs and the
 * raw spec at /docs/json. A bearerAuth scheme is declared so protected routes
 * can be tried directly from the UI.
 */
async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'FanRewards API',
        description: 'Fan rewards API: auth, challenges, rewards, and leaderboard.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await fastify.register(swaggerUi, { routePrefix: '/docs' });
}

export default fp(swaggerPlugin, { name: 'swagger' });
