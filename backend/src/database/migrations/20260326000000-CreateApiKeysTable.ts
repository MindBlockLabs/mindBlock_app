import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKeysTable20260326000000 implements MigrationInterface {
  name = 'CreateApiKeysTable20260326000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."api_key_scope_enum" AS ENUM('read', 'write', 'delete', 'admin', 'custom');

      CREATE TABLE "api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "keyHash" character varying(255) NOT NULL,
        "name" character varying(100) NOT NULL,
        "userId" uuid NOT NULL,
        "scopes" text NOT NULL DEFAULT 'read',
        "expiresAt" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastUsedAt" TIMESTAMP,
        "usageCount" integer NOT NULL DEFAULT 0,
        "ipWhitelist" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_keys_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_api_keys_keyHash" UNIQUE ("keyHash")
      );

      ALTER TABLE "api_keys"
        ADD CONSTRAINT "FK_api_keys_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "api_keys" DROP CONSTRAINT "FK_api_keys_user";
      DROP TABLE "api_keys";
      DROP TYPE "public"."api_key_scope_enum";
    `);
  }
}