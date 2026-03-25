import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './app.module';
import { HealthService } from './health/health.service';

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

  // Enable global exception handling
  app.useGlobalFilters(new HttpExceptionFilter());

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

  // Graceful shutdown handling
  const healthService = app.get(HealthService);
  
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    // Signal health checks that we're shutting down
    healthService.setIsShuttingDown();
    
    // Wait a moment for load balancers to detect the unhealthy state
    setTimeout(async () => {
      console.log('🔄 Closing HTTP server...');
      await app.close();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  await app.listen(3000);
  console.log('🚀 Application is running on: http://localhost:3000');
}
void bootstrap();
