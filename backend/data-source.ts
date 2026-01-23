import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || 'database.sqlite',
  entities: [__dirname + '/src/**/**/*.entity{.ts,.js}'], // Load all entities from src directory
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: true, // set to false in production
});
