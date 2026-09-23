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

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, bodyLimit: 10485760 })
  );

  // Global Exception Filter (Intercepts Zod, DB, Firebase, and unhandled errors into friendly JSON)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Security Headers
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  });

  // CORS (Permits localhost, LAN IP, mobile apps, and custom test domains)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

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

  const port = Number(process.env.API_PORT) || Number(process.env.PORT) || 4000;
  const host = '0.0.0.0';

  await app.listen(port, host);
  logger.log(`Sadaqahbd API is running on http://${host}:${port}/api/v1`);
  logger.log(`API Swagger Docs available on http://${host}:${port}/api/docs`);
}

bootstrap();
