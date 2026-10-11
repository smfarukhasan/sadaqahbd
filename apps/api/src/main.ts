import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ensureItemDonationsTable, ensureStudentProfileColumns, ensureUsersTableSchema } from './database';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Auto-verify and create tables/columns
  await ensureStudentProfileColumns();
  await ensureItemDonationsTable();
  await ensureUsersTableSchema();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10485760,
      connectionTimeout: 10000,
      keepAliveTimeout: 5000,
      requestTimeout: 30000,
      trustProxy: true,
    })
  );

  // Global Exception Filter (Intercepts Zod, DB, Firebase, and unhandled errors into friendly JSON)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Security Headers
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  });

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://192.168.0.106:3000',
    'http://192.168.0.106:3001',
    'https://sadaqahbd.com',
    'https://www.sadaqahbd.com',
  ];
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  // Only the public site or allowed local environments may call this API from a browser.
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production' ||
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Do not let a small shared-hosting process accumulate an unbounded request
  // queue. Excess requests receive a fast 503 and callers can retry later.
  const maxConcurrentRequests = Math.max(
    5,
    Number(process.env.MAX_CONCURRENT_REQUESTS) || 30
  );
  let inFlightRequests = 0;
  const countedRequests = new WeakSet<object>();
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', async (request: object, reply: any) => {
    if (inFlightRequests >= maxConcurrentRequests) {
      reply.header('Retry-After', '3');
      return reply.code(503).send({
        statusCode: 503,
        error: 'ServiceBusy',
        message: 'The service is busy. Please try again shortly.',
      });
    }
    inFlightRequests += 1;
    countedRequests.add(request);
  });
  fastify.addHook('onResponse', async (request: object) => {
    if (countedRequests.delete(request)) {
      inFlightRequests -= 1;
    }
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Sadaqahbd API')
    .setDescription(
      'Fullstack Crowdfunding & Student Aid Platform API documentation'
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const rawPort = process.env.API_PORT || (process.env.PORT && process.env.PORT !== '3000' ? process.env.PORT : '4000');
  if (rawPort && isNaN(Number(rawPort))) {
    await app.listen({ path: rawPort });
    logger.log(`Sadaqahbd API is running on socket ${rawPort}/api/v1`);
  } else {
    const port = Number(rawPort) || 4000;
    const host = '0.0.0.0';
    await app.listen({ port, host });
    logger.log(`Sadaqahbd API is running on http://${host}:${port}/api/v1`);
  }
  logger.log(`API Swagger Docs available on /api/docs`);
}

bootstrap();
