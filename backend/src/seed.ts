import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { DataSource } from "typeorm"

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  await app.close()
}
bootstrap()
