import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { DataSource } from "typeorm"
import { seedQuestions } from "./question/question.seed"
import { seedIQQuestions } from "./iq-assessment/seeds/iq-questions.seed"

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  // Seed existing questions
  await seedQuestions(dataSource)

  // Seed IQ assessment questions
  await seedIQQuestions(dataSource)

  await app.close()
}
bootstrap()
