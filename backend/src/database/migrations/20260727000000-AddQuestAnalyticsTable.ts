import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestAnalyticsTable20260727000000 implements MigrationInterface {
  name = 'AddQuestAnalyticsTable20260727000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Create quest_analytics table
      CREATE TABLE IF NOT EXISTS "quest_analytics" (
        "id" SERIAL NOT NULL,
        "date" date NOT NULL,
        "assignedCount" integer NOT NULL DEFAULT 0,
        "completedCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quest_analytics_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_quest_analytics_date" UNIQUE ("date")
      );

      -- Create indexes for quest_analytics
      CREATE INDEX "IDX_quest_analytics_date" ON "quest_analytics" ("date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Drop indexes
      DROP INDEX IF EXISTS "IDX_quest_analytics_date";

      -- Drop table
      DROP TABLE IF EXISTS "quest_analytics";
    `);
  }
}
