import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Stamp every request with a correlation ID before any other handler runs
  app.use(new CorrelationIdMiddleware().use.bind(new CorrelationIdMiddleware()));

  // Enable global exception handling (catches ALL errors, not just HttpExceptions)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Setup Swagger API Documentation at http://localhost:3000/api
  const config = new DocumentBuilder()
    .setTitle('MindBlock API')
    .setDescription('API documentation for MindBlock Backend')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(3000);
}
void bootstrap();
