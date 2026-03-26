import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import {
  API_VERSION_HEADER,
  API_VERSION_QUERY_PARAM,
  ApiVersionInterceptor,
  ApiVersionService,
  buildVersionedSwaggerDocument,
} from './common/versioning';
import { HealthService } from './health/health.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const apiVersionService = app.get(ApiVersionService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(new CorrelationIdMiddleware().use.bind(new CorrelationIdMiddleware()));

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/*path'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: apiVersionService.getLatestVersion(),
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ApiVersionInterceptor(apiVersionService));

  const config = new DocumentBuilder()
    .setTitle('MindBlock API')
    .setDescription(
      `API documentation for MindBlock Backend. Primary versioning uses URL paths (/api/v1/*, /api/v2/*). Header (${API_VERSION_HEADER}) and query (${API_VERSION_QUERY_PARAM}) negotiation are also supported for versioned resources.`,
    )
    .setVersion(`v${apiVersionService.getLatestVersion()}`)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const v1Document = buildVersionedSwaggerDocument(document, '1');
  const v2Document = buildVersionedSwaggerDocument(document, '2');

  SwaggerModule.setup('api/docs/v1', app, v1Document);
  SwaggerModule.setup('api/docs/v2', app, v2Document);
  SwaggerModule.setup('api/docs/latest', app, v2Document);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', API_VERSION_HEADER],
    exposedHeaders: [
      'X-API-Version',
      'X-API-Latest-Version',
      'X-API-Deprecation',
      'X-API-Version-Status',
      'Sunset',
      'Warning',
      'Link',
    ],
    credentials: true,
  });

  const healthService = app.get(HealthService);

  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    healthService.setIsShuttingDown();

    setTimeout(async () => {
      console.log('Closing HTTP server...');
      await app.close();
      console.log('Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}

void bootstrap();
