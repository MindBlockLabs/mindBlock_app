import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';


'const ENV = process.env.NODE_ENV
console.log('NODE_ENV:', process.env.NODE_ENV);'

@Module({
  imports: [
    'ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV ? '.env' : .env.${ENV.trim()},
      load: [appConfig, databaseConfig],
    }),'
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        blog: configService.get('database.blog'),
        synchronize: configService.get('database.synchronize'),
        autoLoadEntities: configService.get('database.autoload')
    })
    }),
    AuthModule,
  ],
})
export class AppModule {}