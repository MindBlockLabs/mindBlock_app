import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable20260821000000 implements MigrationInterface {
  name = 'CreateSessionsTable20260821000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "session" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "userId" string NOT NULL,
        "refreshTokenHash" VARCHAR NOT NULL UNIQUE,
        "deviceInfo" VARCHAR,
        "ipAddress" VARCHAR,
        "expiresAt" TIMESTAMP NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "session";
    `);
  }
}