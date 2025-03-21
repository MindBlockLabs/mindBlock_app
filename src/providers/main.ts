import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup Swagger API Documentation at http://localhost:3000/api
  const config = new DocumentBuilder()
    .setTitle('MindBlock API')
    .setDescription('API documentation for MindBlock Backend')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
