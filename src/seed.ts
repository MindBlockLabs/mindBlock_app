import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { seedQuestions } from './question/question.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource); 
  await seedQuestions(dataSource);
  await app.close();
}
bootstrap();