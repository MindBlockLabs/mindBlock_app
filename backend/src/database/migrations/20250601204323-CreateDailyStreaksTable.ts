import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyStreaksTable20250601204323 implements MigrationInterface {
  name = 'CreateDailyStreaksTable20250601204323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "daily_streaks" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "last_active_date" date NOT NULL,
        "streak_count" integer NOT NULL DEFAULT 0,
        "longest_streak" integer NOT NULL DEFAULT 0,
        "last_milestone_reached" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_streaks_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_streaks_user_id" UNIQUE ("user_id")
      );

      ALTER TABLE "daily_streaks"
        ADD CONSTRAINT "FK_daily_streaks_user_id" 
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

      CREATE INDEX "IDX_daily_streaks_user_id" ON "daily_streaks" ("user_id");
      CREATE INDEX "IDX_daily_streaks_streak_count" ON "daily_streaks" ("streak_count" DESC);
      CREATE INDEX "IDX_daily_streaks_longest_streak" ON "daily_streaks" ("longest_streak" DESC);
      CREATE INDEX "IDX_daily_streaks_last_active_date" ON "daily_streaks" ("last_active_date" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_daily_streaks_last_active_date";
      DROP INDEX "IDX_daily_streaks_longest_streak";
      DROP INDEX "IDX_daily_streaks_streak_count";
      DROP INDEX "IDX_daily_streaks_user_id";
      
      ALTER TABLE "daily_streaks" DROP CONSTRAINT "FK_daily_streaks_user_id";
      DROP TABLE "daily_streaks";
    `);
  }
} 