import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyQuestSystem20260124000000 implements MigrationInterface {
  name = 'AddDailyQuestSystem20260124000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Create daily_quest table if it doesn't exist
      CREATE TABLE IF NOT EXISTS "daily_quest" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "questDate" date NOT NULL,
        "totalQuestions" integer NOT NULL DEFAULT 10,
        "completedQuestions" integer NOT NULL DEFAULT 0,
        "isCompleted" boolean NOT NULL DEFAULT false,
        "pointsEarned" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_daily_quest_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_quest_user_date" UNIQUE ("userId", "questDate")
      );

      -- Create daily_quest_puzzles join table
      CREATE TABLE "daily_quest_puzzles" (
        "id" SERIAL NOT NULL,
        "dailyQuestId" integer NOT NULL,
        "puzzleId" uuid NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_daily_quest_puzzles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_quest_puzzles" UNIQUE ("dailyQuestId", "puzzleId")
      );

      -- Add foreign key constraints
      ALTER TABLE "daily_quest"
        ADD CONSTRAINT "FK_daily_quest_user" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;

      ALTER TABLE "daily_quest_puzzles"
        ADD CONSTRAINT "FK_daily_quest_puzzles_quest" 
        FOREIGN KEY ("dailyQuestId") REFERENCES "daily_quest"("id") ON DELETE CASCADE;

      ALTER TABLE "daily_quest_puzzles"
        ADD CONSTRAINT "FK_daily_quest_puzzles_puzzle" 
        FOREIGN KEY ("puzzleId") REFERENCES "puzzles"("id") ON DELETE CASCADE;

      -- Add dailyQuestId to user_progress table if the column doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_progress' AND column_name = 'dailyQuestId'
        ) THEN
          ALTER TABLE "user_progress"
            ADD COLUMN "dailyQuestId" integer;
          
          ALTER TABLE "user_progress"
            ADD CONSTRAINT "FK_user_progress_daily_quest" 
            FOREIGN KEY ("dailyQuestId") REFERENCES "daily_quest"("id") ON DELETE SET NULL;
        END IF;
      END $$;

      -- Create indexes for daily_quest
      CREATE INDEX "IDX_daily_quest_userId" ON "daily_quest" ("userId");
      CREATE INDEX "IDX_daily_quest_questDate" ON "daily_quest" ("questDate");
      CREATE INDEX "IDX_daily_quest_user_date" ON "daily_quest" ("userId", "questDate");

      -- Create indexes for daily_quest_puzzles
      CREATE INDEX "IDX_daily_quest_puzzles_questId" ON "daily_quest_puzzles" ("dailyQuestId");

      -- Create index for user_progress.dailyQuestId
      CREATE INDEX "IDX_user_progress_dailyQuestId" ON "user_progress" ("dailyQuestId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Drop indexes
      DROP INDEX IF EXISTS "IDX_user_progress_dailyQuestId";
      DROP INDEX IF EXISTS "IDX_daily_quest_puzzles_questId";
      DROP INDEX IF EXISTS "IDX_daily_quest_user_date";
      DROP INDEX IF EXISTS "IDX_daily_quest_questDate";
      DROP INDEX IF EXISTS "IDX_daily_quest_userId";

      -- Remove dailyQuestId from user_progress
      ALTER TABLE "user_progress" DROP CONSTRAINT IF EXISTS "FK_user_progress_daily_quest";
      ALTER TABLE "user_progress" DROP COLUMN IF EXISTS "dailyQuestId";

      -- Drop foreign key constraints
      ALTER TABLE "daily_quest_puzzles" DROP CONSTRAINT IF EXISTS "FK_daily_quest_puzzles_puzzle";
      ALTER TABLE "daily_quest_puzzles" DROP CONSTRAINT IF EXISTS "FK_daily_quest_puzzles_quest";
      ALTER TABLE "daily_quest" DROP CONSTRAINT IF EXISTS "FK_daily_quest_user";

      -- Drop tables
      DROP TABLE IF EXISTS "daily_quest_puzzles";
      DROP TABLE IF EXISTS "daily_quest";
    `);
  }
}
