import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameSessionCompletionSummary20260820000000
  implements MigrationInterface
{
  name = 'AddGameSessionCompletionSummary20260820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Server-calculated completion summary fields for game_sessions
      ALTER TABLE "game_sessions"
        ADD COLUMN IF NOT EXISTS "accuracy" integer,
        ADD COLUMN IF NOT EXISTS "time_spent_seconds" integer,
        ADD COLUMN IF NOT EXISTS "category_performance" jsonb,
        ADD COLUMN IF NOT EXISTS "previous_streak" integer,
        ADD COLUMN IF NOT EXISTS "current_streak" integer,
        ADD COLUMN IF NOT EXISTS "reward_eligible" boolean,
        ADD COLUMN IF NOT EXISTS "reward_reason" varchar(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_sessions"
        DROP COLUMN IF EXISTS "accuracy",
        DROP COLUMN IF EXISTS "time_spent_seconds",
        DROP COLUMN IF EXISTS "category_performance",
        DROP COLUMN IF EXISTS "previous_streak",
        DROP COLUMN IF EXISTS "current_streak",
        DROP COLUMN IF EXISTS "reward_eligible",
        DROP COLUMN IF EXISTS "reward_reason";
    `);
  }
}
